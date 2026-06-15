import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(localStorage.getItem('ga_theme') === 'dark');

  constructor() {
    this.applyTheme(this.dark());
    effect(() => {
      const d = this.dark();
      this.applyTheme(d);
      localStorage.setItem('ga_theme', d ? 'dark' : 'light');
    });
  }

  toggle(): void { this.dark.update(v => !v); }

  private applyTheme(dark: boolean): void {
    document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  }
}
