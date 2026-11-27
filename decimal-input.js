// Pola liczbowe: polska klawiatura (iOS/Android) daje przecinek, a <input type="number"> go odrzuca
// („1,4” → „14” albo puste). Zamieniamy każde type="number" na tekst z klawiaturą dziesiętną
// i normalizujemy przecinek na kropkę, zanim wartość trafi do aplikacji (parseFloat działa dalej).
import React from "react";

const ce = React.createElement;
const norm = (v) => {
  let s = String(v).replace(/,/g, ".").replace(/[^\d.\-]/g, "");
  const i = s.indexOf(".");
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, ""); // tylko jeden separator
  return s;
};

React.createElement = function (type, props, ...children) {
  if (type === "input" && props && props.type === "number") {
    const { type: _t, step: _s, onChange, ...rest } = props;
    props = {
      ...rest,
      type: "text",
      inputMode: props.inputMode || "decimal",
      autoComplete: "off",
      onChange: onChange && ((e) => {
        const v = norm(e.target.value);
        if (v !== e.target.value) e.target.value = v;
        return onChange(e);
      }),
    };
  }
  return ce.call(this, type, props, ...children);
};
