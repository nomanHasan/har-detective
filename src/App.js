import React from 'react';
import './style.css';
import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';

export default function App() {
  function handleEditorChange(value, event) {
    console.log('here is the current model value:', value);
  }

  const startingCode = `{"obj": {"a":1}}`;

  return (
    <div>
      <Editor
        height="90vh"
        theme="vs-dark"
        defaultLanguage="json"
        onChange={handleEditorChange}
        defaultValue={startingCode}
      />
    </div>
  );
}
