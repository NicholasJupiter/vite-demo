const Koa = require('koa');
const path = require('path');
const fs = require('fs');
const compileSFC = require('@vue/compiler-sfc');
const compileDOM = require('@vue/compiler-dom');
const app = new Koa();

app.use(async ctx => {
  const { url, query } = ctx.request;
  if (url === '/') {
    const content = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8');
    ctx.type = 'text/html';
    ctx.body = content;
  } else if (url.endsWith('.js')) {
    // 处理js文件
    const p = path.join(__dirname, url);
    ctx.type = 'text/javascript';
    const fileContent = rewriteImpotr(fs.readFileSync(p, 'utf-8'));
    ctx.body = fileContent;
  } else if (url.startsWith('/@module/')) {
    // 重写modules的路径文件 
    const moduleName = url.replace('/@module/', '');
    const prefix = path.join(__dirname, `./node_modules`, moduleName);
    const ret = rewriteImpotr(fs.readFileSync(
      path.join(prefix, require(prefix + '/package.json').module
      ),
      'utf-8')
    );
    ctx.type = 'text/javascript';
    ctx.body = ret;
  } else if (url.includes('.vue')) { // 解析vue文件
    const p = path.join(__dirname, url.split('?')[0]);
    // 没有type就是解析 js文件
    const ret = compileSFC.parse(fs.readFileSync(p, 'utf-8'), { mode: 'module' });
    if (!query.type) {
      const scriptContent = ret.descriptor.script.content.replace('export default', 'const __script = ');
      ctx.type = 'text/javascript';
      ctx.body = `
      ${rewriteImpotr(scriptContent)}
        import {render as __render} from '${url}?type=template';
        __script.render = __render;
        export default __script;
      `;
    } else if (query.type === 'template') {
      const templateContent = compileDOM.compile(ret.descriptor.template.content, { mode: 'module' }).code;
      ctx.type = 'text/javascript';
      ctx.body = `
        ${rewriteImpotr(templateContent)}
      `;
    }

  }
});


function rewriteImpotr (content) {
  return content.replace(/from ["'](.*)["']/g, ($1, $2) => {
    // 如果不是node_module包
    if (/^.?.?\//.test($2)) {
      return $1;
    } else {
      return `from '/@module/${$2}'`;
    }
  })
}

app.listen("3001")