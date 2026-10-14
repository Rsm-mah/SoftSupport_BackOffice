import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface EditorCommand {
  command: string;
  label: string;
  icon: string;
  style?: string;
  value?: string;
}

@Component({
  selector: 'softsupport-rich-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SoftSupportRichEditorComponent), multi: true }],
  template: `
    <div class="ss-editor" [class.ss-editor--focus]="focused()" [class.ss-editor--error]="invalid()" [class.ss-editor--disabled]="disabled()">
      <div class="ss-editor__toolbar" role="toolbar" [attr.aria-label]="label()">
        @for (item of commands; track item.command + (item.value ?? '')) {
          <button
            type="button"
            class="ss-editor__tool"
            [title]="item.label"
            [attr.aria-label]="item.label"
            [disabled]="disabled()"
            (mousedown)="$event.preventDefault()"
            (click)="run(item)"
          >
            <span [class]="item.style ?? ''">{{ item.icon }}</span>
          </button>
        }
        <span class="ss-editor__sep" aria-hidden="true"></span>
        <button type="button" class="ss-editor__tool" title="Lien" aria-label="Lien" [disabled]="disabled()" (mousedown)="$event.preventDefault()" (click)="link()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>
        </button>
        <button type="button" class="ss-editor__tool" title="Effacer la mise en forme" aria-label="Effacer la mise en forme" [disabled]="disabled()" (mousedown)="$event.preventDefault()" (click)="run({ command: 'removeFormat', label: '', icon: '' })">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/><path d="m3 3 18 18"/></svg>
        </button>
      </div>
      <div
        #area
        class="ss-editor__area ss-article-content"
        [attr.contenteditable]="!disabled()"
        role="textbox"
        aria-multiline="true"
        [attr.aria-label]="label()"
        [attr.data-placeholder]="placeholder()"
        [style.min-height.px]="minHeight()"
        (input)="emit()"
        (focus)="focused.set(true)"
        (blur)="onBlur()"
      ></div>
    </div>
  `,
  styles: [
    `
      .ss-editor {
        border: 1px solid #e2e8f0;
        border-radius: 0.6rem;
        background: #fff;
        transition: border-color 0.2s, box-shadow 0.2s;
        overflow: hidden;
      }
      .ss-editor--focus {
        border-color: #0e7490;
        box-shadow: 0 0 0 3px rgba(14, 116, 144, 0.12);
      }
      .ss-editor--error {
        border-color: #e03e3e;
      }
      .ss-editor--disabled {
        background: #f8fafc;
      }
      .ss-editor__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px;
        padding: 4px 6px;
        border-bottom: 1px solid #eef2f7;
        background: #f8fafc;
      }
      .ss-editor__tool {
        display: inline-flex;
        height: 28px;
        width: 28px;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: #475569;
        font-size: 13px;
        font-weight: 700;
        transition: background 0.15s, color 0.15s;
      }
      .ss-editor__tool:hover:not(:disabled) {
        background: #e0f2fe;
        color: #0e7490;
      }
      .ss-editor__tool :is(svg) {
        height: 15px;
        width: 15px;
      }
      .ss-editor__sep {
        margin: 0 4px;
        height: 18px;
        width: 1px;
        background: #e2e8f0;
      }
      .ss-editor__area {
        max-height: 360px;
        overflow-y: auto;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
      }
      .ss-editor__area:empty::before {
        content: attr(data-placeholder);
        color: #94a3b8;
      }
    `,
  ],
})
export class SoftSupportRichEditorComponent implements ControlValueAccessor, AfterViewInit {
  readonly label = input('');
  readonly placeholder = input('');
  readonly minHeight = input(140);
  readonly invalid = input(false);

  readonly focused = signal(false);
  readonly disabled = signal(false);

  private readonly area = viewChild<ElementRef<HTMLDivElement>>('area');
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private pending: string | null = null;

  readonly commands: readonly EditorCommand[] = [
    { command: 'bold', label: 'Gras', icon: 'B', style: 'font-bold' },
    { command: 'italic', label: 'Italique', icon: 'I', style: 'italic font-serif' },
    { command: 'underline', label: 'Souligné', icon: 'S', style: 'underline' },
    { command: 'formatBlock', value: 'h3', label: 'Titre', icon: 'T', style: 'font-extrabold' },
    { command: 'insertUnorderedList', label: 'Liste à puces', icon: '•≡', style: '' },
    { command: 'insertOrderedList', label: 'Liste numérotée', icon: '1≡', style: 'text-[11px]' },
    { command: 'formatBlock', value: 'pre', label: 'Code', icon: '</>', style: 'font-mono text-[11px]' },
  ];

  writeValue(value: string | null): void {
    const html = value ?? '';
    const area = this.area()?.nativeElement;
    if (area) {
      if (area.innerHTML !== html) {
        area.innerHTML = html;
      }
    } else {
      this.pending = html;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  ngAfterViewInit(): void {
    if (this.pending !== null) {
      this.writeValue(this.pending);
      this.pending = null;
    }
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  run(item: EditorCommand): void {
    this.area()!.nativeElement.focus();
    document.execCommand(item.command, false, item.value);
    this.emit();
  }

  link(): void {
    const url = window.prompt('Adresse du lien (https://…)');
    if (url && /^(https?:|mailto:)/i.test(url.trim())) {
      this.area()!.nativeElement.focus();
      document.execCommand('createLink', false, url.trim());
      this.emit();
    }
  }

  emit(): void {
    const html = this.area()!.nativeElement.innerHTML;
    // Un éditeur vidé laisse souvent « <br> » : on le considère vide pour la validation.
    this.onChange(this.area()!.nativeElement.textContent?.trim() || html.includes('<img') ? html : '');
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }
}
