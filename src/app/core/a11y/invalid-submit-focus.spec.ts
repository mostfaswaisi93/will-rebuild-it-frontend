import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InvalidSubmitFocus } from './invalid-submit-focus';

/**
 * The service listens on the document and acts after the next render, so each
 * case submits a real form in a real DOM and flushes a render pass, rather
 * than asserting on internals.
 */
describe('InvalidSubmitFocus', () => {
  let host: HTMLElement;

  const submit = (markup: string) => {
    host.innerHTML = markup;
    host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    // `afterNextRender` callbacks are flushed by a tick.
    TestBed.inject(ApplicationRef).tick();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    host = document.createElement('div');
    document.body.appendChild(host);
    TestBed.inject(InvalidSubmitFocus).install();
  });

  afterEach(() => host.remove());

  it('focuses the first control in error', () => {
    submit(`
      <form>
        <input id="a" aria-invalid="false" />
        <input id="b" aria-invalid="true" />
        <input id="c" aria-invalid="true" />
      </form>`);
    expect(document.activeElement?.id).toBe('b');
  });

  it('ignores valid controls rather than landing on the first field', () => {
    // Every valid control renders `aria-invalid="false"`, so a presence
    // selector (`[aria-invalid]`) would focus "a" here and look almost right.
    host.innerHTML = '<input id="outside" />';
    const outside = host.querySelector<HTMLElement>('#outside')!;
    outside.focus();

    submit(`
      <input id="outside" />
      <form>
        <input id="a" aria-invalid="false" />
        <input id="b" aria-invalid="false" />
      </form>`);
    expect(document.activeElement?.id).not.toBe('a');
  });

  it('reaches inside a group whose error belongs to the fieldset', () => {
    // A <fieldset> cannot take focus, so focusing the match itself would
    // silently do nothing — the shape the trades and address groups use.
    submit(`
      <form>
        <fieldset aria-invalid="true">
          <input id="first-in-group" type="checkbox" />
          <input id="second" type="checkbox" />
        </fieldset>
      </form>`);
    expect(document.activeElement?.id).toBe('first-in-group');
  });
});
