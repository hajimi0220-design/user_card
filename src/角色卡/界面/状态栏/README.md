# 状态栏外观设置说明

这个文件夹里的 `theme-config.js` 是外观配置文件。你不需要会写代码，只要照着改引号里的内容，然后保存文件、刷新酒馆页面即可。

## 怎么换字体

1. 把你的字体文件放到 `dist/角色卡/界面/状态栏/` 文件夹里。
2. 打开同文件夹里的 `theme-config.js`。
3. 找到这一行：

```js
fontFileName: '',
```

4. 把空引号改成你的字体文件名。例如字体文件叫 `甜甜圈.ttf`，就写成：

```js
fontFileName: '甜甜圈.ttf',
```

5. 保存后刷新酒馆页面。

注意：字体文件名要一模一样，包括 `.ttf` 后缀。建议文件名不要有空格。

## 怎么换背景图片

找到这一行：

```js
appBackgroundImage: '',
```

如果你想用网络图片，就把图片地址放进去：

```js
appBackgroundImage: 'https://example.com/bg.png',
```

如果你想用本地图片，把图片放到 `dist/角色卡/界面/状态栏/`，然后写文件名：

```js
appBackgroundImage: './bg.png',
```

不想用图片时，保持空引号即可。

## 怎么改颜色

颜色都是 `#` 开头的 6 位颜色值，例如 `#a78bfa`。你可以在浏览器搜索“颜色选择器”，挑一个颜色，把值复制进来。

常用设置：

- `appBackgroundColor`：整个界面的背景色。
- `panelBackgroundColor`：顶部栏、历史面板、设置面板的背景色。
- `storyBackgroundColor`：正文框的背景色。
- `storyTextColor`：正文普通文字颜色。
- `accentColor`：按钮高亮、选中标签、左侧正文线条的主色。
- `mutedTextColor`：不重要的小字颜色。
- `borderColor`：边框颜色。
- `inputBackgroundColor`：底部输入框背景色。

Markdown 和高亮设置：

- `markdownBoldColor`：`**加粗**` 文字颜色。
- `markdownItalicColor`：`*斜体*` 文字颜色。
- `markdownCodeColor`：行内代码和代码块文字颜色。
- `markdownCodeBackground`：代码背景色。
- `quoteDoubleColor`：英文双引号 `"这样"` 里的内容颜色。
- `quoteSingleColor`：英文单引号 `'这样'` 里的内容颜色。
- `quoteBracketColor`：括号、方括号、【】里的内容颜色。
- `quoteChineseColor`：中文引号 “这样”、‘这样’、「这样」里的内容颜色。

## 页面里的设置按钮

状态栏右上角有一个调色盘按钮。你也可以在那里直接改颜色和背景图片。

页面里改过的内容会长期记住，刷新也不会丢。如果你想重新使用 `theme-config.js` 里的默认设置，点设置面板里的“恢复默认”。

## 隐藏注释

正文里被下面这种符号包住的内容会自动隐藏，用户看不到：

```html
<!--这里是隐藏内容-->
```

包括 `<!--` 和 `-->` 这两个符号本身也不会显示。
