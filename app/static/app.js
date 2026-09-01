// Client-side interactions for Crypto Tracker (No build step, pure vanilla JS)
document.addEventListener('DOMContentLoaded', () => {
  // Initialize lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Keyboard shortcut: Escape closes all modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('[id^="modal-"]');
      modals.forEach((m) => m.classList.add('hidden'));
    }
  });
});
