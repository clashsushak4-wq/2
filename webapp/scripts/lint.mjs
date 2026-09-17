import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const roots = [
  path.resolve('src/pages/trade'),
  path.resolve('src/shared/ui/BottomSheet.tsx'),
];
const issues = [];
const cyrillic = /[А-Яа-яЁёІіЇїЄє]/;

const collectFiles = (target) => {
  const stats = fs.statSync(target);
  if (stats.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(target, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath);
    return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
  });
};

const report = (sourceFile, node, message) => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  issues.push(`${path.relative(process.cwd(), sourceFile.fileName)}:${line + 1}:${character + 1} ${message}`);
};

for (const file of roots.flatMap(collectFiles)) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const visit = (node) => {
    if ((ts.isStringLiteralLike(node) || ts.isJsxText(node)) && cyrillic.test(node.text)) {
      report(sourceFile, node, 'user-facing Cyrillic text must use i18n');
    }
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && node.expression.expression.getText(sourceFile) === 'console'
    ) {
      report(sourceFile, node, 'console calls are not allowed');
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Trade lint passed.');
}
