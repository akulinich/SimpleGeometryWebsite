import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import os
import subprocess
import threading
from datetime import datetime
from pathlib import Path

PROMPTS_DIR  = Path(__file__).parent / 'prompts'
PROMPT_FILE  = PROMPTS_DIR / 'sanity.md'
PROJECT_ROOT = Path(__file__).parent.parent.parent


# ─── Prompt loader ───────────────────────────────────────────────────────────

def load_prompt(name, **kwargs):
    text = (PROMPTS_DIR / f'{name}.md').read_text(encoding='utf-8').strip()
    for key, val in kwargs.items():
        text = text.replace(f'{{{key}}}', val)
    return text


# ─── App ─────────────────────────────────────────────────────────────────────

class SanityApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Sanity Check')
        self.geometry('820x600')
        self.minsize(560, 400)

        self._running = False
        self._proc = None

        self._build_ui()

    def _build_ui(self):
        top = ttk.Frame(self)
        top.pack(fill='x', padx=12, pady=(12, 6))

        self.run_btn = ttk.Button(top, text='Запустить проверку', command=self._toggle)
        self.run_btn.pack(side='left')

        self.save_btn = ttk.Button(top, text='Сохранить отчёт', command=self._save, state='disabled')
        self.save_btn.pack(side='left', padx=(8, 0))

        ttk.Button(top, text='Очистить', command=self._clear).pack(side='left', padx=(8, 0))

        ttk.Button(top, text='Открыть промпт', command=self._open_prompt).pack(side='right')

        self.status_var = tk.StringVar(value=f'Корень проекта: {PROJECT_ROOT}')
        ttk.Label(self, textvariable=self.status_var, foreground='#666').pack(
            anchor='w', padx=12, pady=(0, 6))

        self.output = scrolledtext.ScrolledText(
            self, wrap='word', font=('Consolas', 10), state='disabled')
        self.output.pack(fill='both', expand=True, padx=12, pady=(0, 12))

    # ── Output helpers ──────────────────────────────────────────────────────

    def _write(self, text):
        self.output.config(state='normal')
        self.output.insert('end', text)
        self.output.see('end')
        self.output.config(state='disabled')

    def _clear(self):
        self.output.config(state='normal')
        self.output.delete('1.0', 'end')
        self.output.config(state='disabled')
        self.save_btn.config(state='disabled')

    def _save(self):
        text = self.output.get('1.0', 'end').strip()
        if not text:
            return
        default = f'sanity-report-{datetime.now():%Y%m%d-%H%M%S}.md'
        path = filedialog.asksaveasfilename(
            defaultextension='.md', initialfile=default,
            filetypes=[('Markdown', '*.md'), ('All files', '*.*')])
        if path:
            Path(path).write_text(text, encoding='utf-8')
            self.status_var.set(f'Сохранено: {path}')

    def _open_prompt(self):
        if not PROMPT_FILE.exists():
            messagebox.showerror('Ошибка', f'Не найден промпт {PROMPT_FILE}')
            return
        try:
            os.startfile(PROMPT_FILE)
        except Exception as e:
            messagebox.showerror('Ошибка', f'Не удалось открыть промпт: {e}')

    # ── Run ──────────────────────────────────────────────────────────────────

    def _toggle(self):
        if self._running:
            self._stop()
        else:
            self._run()

    def _run(self):
        try:
            prompt = load_prompt('sanity')
        except FileNotFoundError:
            messagebox.showerror('Ошибка', 'Не найден промпт prompts/sanity.md')
            return

        self._clear()
        self._running = True
        self.run_btn.config(text='Остановить')
        self.status_var.set('Проверка запущена...')

        cmd = ['claude', '-p', prompt, '--allowedTools', 'Read,Grep,Glob']
        threading.Thread(target=self._worker, args=(cmd,), daemon=True).start()

    def _stop(self):
        if self._proc and self._proc.poll() is None:
            self._proc.terminate()
        self.status_var.set('Остановлено.')

    def _worker(self, cmd):
        try:
            self._proc = subprocess.Popen(
                cmd, cwd=str(PROJECT_ROOT),
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, encoding='utf-8', errors='replace')
            for line in self._proc.stdout:
                self.after(0, self._write, line)
            self._proc.wait()
        except FileNotFoundError:
            self.after(0, self._write, 'Ошибка: команда claude не найдена.\n')
        except Exception as e:
            self.after(0, self._write, f'Ошибка: {e}\n')
        finally:
            self.after(0, self._finish)

    def _finish(self):
        self._running = False
        self._proc = None
        self.run_btn.config(text='Запустить проверку')
        if self.output.get('1.0', 'end').strip():
            self.save_btn.config(state='normal')
        self.status_var.set('Готово.')


if __name__ == '__main__':
    SanityApp().mainloop()
