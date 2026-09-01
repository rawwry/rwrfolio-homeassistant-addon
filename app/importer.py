import csv
import io
import uuid
import datetime
from typing import List, Dict, Tuple, Any
import openpyxl

def parse_uploaded_file(file_bytes: bytes, filename: str) -> Tuple[List[Dict[str, Any]], str, List[str]]:
    """
    Parses an uploaded CSV or XLSX file and returns a list of normalized transaction dictionaries,
    the detected exchange source, and any warning/error messages.
    """
    errors = []
    transactions = []
    source = "generic"

    if filename.lower().endswith(".xlsx"):
        # Excel parsing via openpyxl
        try:
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
            if not rows:
                return [], "unknown", ["Die Excel-Datei ist leer."]
            
            headers = [str(cell).strip() if cell is not None else "" for cell in rows[0]]
            data_rows = []
            for row in rows[1:]:
                if any(row):
                    data_rows.append({headers[i]: str(row[i]).strip() if i < len(row) and row[i] is not None else "" for i in range(len(headers))})
            
            transactions, source, errs = process_parsed_rows(data_rows)
            errors.extend(errs)
        except Exception as e:
            errors.append(f"Fehler beim Lesen der Excel-Datei: {str(e)}")
            return [], "unknown", errors
    else:
        # CSV parsing
        try:
            # Try utf-8 first, fallback to latin-1
            text = ""
            try:
                text = file_bytes.decode("utf-8-sig")
            except UnicodeDecodeError:
                text = file_bytes.decode("latin-1")
            
            # Detect delimiter (comma or semicolon)
            sample_line = text.splitlines()[0] if text.splitlines() else ""
            delimiter = ";" if ";" in sample_line and sample_line.count(";") > sample_line.count(",") else ","
            
            reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
            data_rows = list(reader)
            
            transactions, source, errs = process_parsed_rows(data_rows)
            errors.extend(errs)
        except Exception as e:
            errors.append(f"Fehler beim Verarbeiten der CSV: {str(e)}")
            return [], "unknown", errors

    return transactions, source, errors

def process_parsed_rows(rows: List[Dict[str, str]]) -> Tuple[List[Dict[str, Any]], str, List[str]]:
    if not rows:
        return [], "unknown", ["Keine Datenzeilen gefunden."]

    first_keys = [k.strip().lower() for k in rows[0].keys()]
    
    # Detect Crypto.com App CSV format
    is_crypto_com = any("transaction description" in k or "native amount" in k or "to currency" in k for k in first_keys)
    
    transactions = []
    errors = []
    
    if is_crypto_com:
        source = "crypto_com"
        for idx, row in enumerate(rows, start=1):
            try:
                tx = parse_crypto_com_row(row, idx)
                if tx:
                    transactions.append(tx)
            except Exception as e:
                errors.append(f"Zeile {idx}: {str(e)}")
    else:
        source = "generic"
        for idx, row in enumerate(rows, start=1):
            try:
                tx = parse_generic_row(row, idx)
                if tx:
                    transactions.append(tx)
            except Exception as e:
                errors.append(f"Zeile {idx}: {str(e)}")

    return transactions, source, errors

def clean_float(val: Any) -> float:
    if val is None:
        return 0.0
    s = str(val).strip().replace("€", "").replace("$", "").replace("EUR", "").replace("USD", "").strip()
    if not s:
        return 0.0
    # Handle European decimal comma if comma is present without dot
    if "," in s and "." not in s:
        s = s.replace(",", ".")
    elif "," in s and "." in s:
        # e.g. 1.234,56
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0

def parse_crypto_com_row(row: Dict[str, str], idx: int) -> Dict[str, Any]:
    # Crypto.com App Column standard mapping:
    # Timestamp (UTC), Transaction Description, Currency, Amount, To Currency, To Amount, Native Currency, Native Amount, Native Amount (in USD), Transaction Kind, Transaction Hash
    get_col = lambda name: row.get(name, "") or row.get(name.lower(), "") or row.get(name.replace(" ", "_"), "")

    timestamp = get_col("Timestamp (UTC)") or get_col("Timestamp") or datetime.datetime.utcnow().isoformat()
    desc = get_col("Transaction Description") or get_col("Description") or "Crypto.com Transaktion"
    curr = (get_col("Currency") or "").strip().upper()
    amount = clean_float(get_col("Amount"))
    to_curr = (get_col("To Currency") or "").strip().upper()
    to_amount = clean_float(get_col("To Amount"))
    native_curr = (get_col("Native Currency") or "").strip().upper()
    native_amount = clean_float(get_col("Native Amount"))
    tx_kind = get_col("Transaction Kind") or ""
    tx_hash = get_col("Transaction Hash") or ""

    tx_type = "OTHER"
    spent_curr = ""
    spent_amt = 0.0
    recv_curr = ""
    recv_amt = 0.0
    price_per_unit = 0.0

    desc_lower = desc.lower()

    if "buy" in desc_lower or "purchase" in desc_lower or tx_kind == "crypto_purchase":
        tx_type = "BUY"
        # In Crypto.com: Currency = Crypto, Amount = Crypto bought, Native Currency = EUR, Native Amount = EUR spent
        # Or Currency = EUR spent, To Currency = BTC bought
        if to_curr and to_amount > 0:
            spent_curr = curr or "EUR"
            spent_amt = amount
            recv_curr = to_curr
            recv_amt = to_amount
        else:
            recv_curr = curr
            recv_amt = amount
            spent_curr = native_curr or "EUR"
            spent_amt = abs(native_amount)

        if recv_amt > 0 and spent_amt > 0:
            price_per_unit = spent_amt / recv_amt

    elif "sell" in desc_lower:
        tx_type = "SELL"
        spent_curr = curr
        spent_amt = amount
        recv_curr = to_curr or native_curr or "EUR"
        recv_amt = to_amount if to_amount > 0 else abs(native_amount)
        if spent_amt > 0 and recv_amt > 0:
            price_per_unit = recv_amt / spent_amt

    elif "card cashback" in desc_lower or "reward" in desc_lower or "cashback" in desc_lower:
        tx_type = "REWARD"
        recv_curr = curr
        recv_amt = amount
        spent_curr = ""
        spent_amt = 0.0
        if recv_amt > 0 and native_amount > 0:
            price_per_unit = native_amount / recv_amt

    elif "earn" in desc_lower or "stake" in desc_lower or "staking" in desc_lower:
        tx_type = "STAKE"
        recv_curr = curr
        recv_amt = amount
        spent_curr = ""
        spent_amt = 0.0
        if recv_amt > 0 and native_amount > 0:
            price_per_unit = native_amount / recv_amt

    elif "transfer" in desc_lower or "deposit" in desc_lower:
        tx_type = "TRANSFER"
        recv_curr = curr
        recv_amt = amount

    else:
        # Fallback heuristic
        if amount > 0:
            recv_curr = curr
            recv_amt = amount
            tx_type = "BUY"
        else:
            spent_curr = curr
            spent_amt = abs(amount)
            tx_type = "SELL"

    tx_id = tx_hash if tx_hash else f"cdc_{timestamp}_{recv_curr}_{recv_amt}_{idx}"

    return {
        "id": tx_id,
        "timestamp": timestamp,
        "source": "crypto_com",
        "type": tx_type,
        "description": desc,
        "spent_currency": spent_curr,
        "spent_amount": spent_amt,
        "received_currency": recv_curr,
        "received_amount": recv_amt,
        "price_per_unit_eur": price_per_unit,
        "native_currency": native_curr,
        "native_amount": native_amount,
        "transaction_kind": tx_kind,
        "fee": 0.0,
        "fee_currency": "",
        "notes": f"Crypto.com Import ({tx_kind})",
        "imported_at": datetime.datetime.utcnow().isoformat()
    }

def parse_generic_row(row: Dict[str, str], idx: int) -> Dict[str, Any]:
    # Generic CSV handling
    keys_map = {k.lower().strip(): v for k, v in row.items()}
    
    timestamp = keys_map.get("timestamp") or keys_map.get("date") or keys_map.get("datum") or datetime.datetime.utcnow().isoformat()
    desc = keys_map.get("description") or keys_map.get("beschreibung") or f"Transaktion #{idx}"
    tx_type = (keys_map.get("type") or keys_map.get("typ") or "BUY").upper()
    
    recv_curr = (keys_map.get("received_currency") or keys_map.get("currency") or keys_map.get("coin") or keys_map.get("asset") or "").upper()
    recv_amt = clean_float(keys_map.get("received_amount") or keys_map.get("amount") or keys_map.get("menge"))
    
    spent_curr = (keys_map.get("spent_currency") or keys_map.get("fiat_currency") or "EUR").upper()
    spent_amt = clean_float(keys_map.get("spent_amount") or keys_map.get("total_eur") or keys_map.get("preis_gesamt"))
    
    price_per_unit = clean_float(keys_map.get("price_per_unit_eur") or keys_map.get("unit_price") or keys_map.get("einzelpreis"))
    if price_per_unit == 0.0 and recv_amt > 0 and spent_amt > 0:
        price_per_unit = spent_amt / recv_amt

    return {
        "id": f"gen_{timestamp}_{recv_curr}_{idx}_{uuid.uuid4().hex[:6]}",
        "timestamp": timestamp,
        "source": "generic",
        "type": tx_type,
        "description": desc,
        "spent_currency": spent_curr,
        "spent_amount": spent_amt,
        "received_currency": recv_curr,
        "received_amount": recv_amt,
        "price_per_unit_eur": price_per_unit,
        "native_currency": "EUR",
        "native_amount": spent_amt,
        "transaction_kind": "manual_or_generic",
        "fee": 0.0,
        "fee_currency": "",
        "notes": "CSV Import",
        "imported_at": datetime.datetime.utcnow().isoformat()
    }
