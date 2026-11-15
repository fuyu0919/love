---
title: "个人博客搭建教程（上）"
pubDate: 2022-10-14
tags:
  - 博客教程
---

## 个人博客搭建教程（上）

（基于windows系统）

### 使用的工具及软件

博客框架为hexo，博客文件托管在GitHub，博客网站用netlify做代理，博客文件配置用VScode,写博客在typora。

#### hexo

[hexo官网](https://hexo.io/zh-cn/)



​		hexo是一个基于nodejs的静态博客生成器，是目前主流的博客框架

#### netlify

[netlify官网](https://app.netlify.com/)

​		Netlify是一个现代网站自动化系统



### 前期准备

#### nodejs环境的配置

[nodejs官网](https://nodejs.org/en/)



​	Node.js发布于2009年5月，由Ryan Dahl开发，是一个基于[Chrome](https://baike.baidu.com/item/Chrome/5633839?fromModule=lemma_inlink) [V8](https://baike.baidu.com/item/V8/6178125?fromModule=lemma_inlink)引擎的[JavaScript](https://baike.baidu.com/item/JavaScript/321142?fromModule=lemma_inlink)运行环境，使用了一个[事件驱动](https://baike.baidu.com/item/事件驱动/9597519?fromModule=lemma_inlink)、非阻塞式I/O模型，让JavaScript 运行在[服务端](https://baike.baidu.com/item/服务端/6492316?fromModule=lemma_inlink)的开发平台。



win+r 后输入cmd调用控制台程序



在控制台窗口输入

```
node -v
```



若出现版本号即说明安装成功


在控制台窗口输入

```
npm -v
```

查询包管理器npm的版本号[npm和yarn](https://blog.csdn.net/csdn_jwdlh/article/details/124093999)\

`npm`默认的官网源在使用中可能会比较慢，为提高速度在控制台窗口输入下列代码将源设置为淘宝源。

```
npm config get registry # 查询正在使用的源
npm config set registry https://registry.npm.taobao.org # 修改源为淘宝源
npm config get registry # 查询正在使用的源
```





### 搭建博客

使用包管理工具npm搭建博客。

首先win+r输入cmd调用控制台窗口输入以下代码全局安装hexo命令行工具

```
npm install hexo-cli -g
```

然后新建一个博客文件夹用来储存博客的配置文件、图片、缓存等等。





输入以下代码

```
hexo init "你的博客目录名称" 
```



可以看到文件夹内有以下内容



config.yml

为全局配置文件，网站的很多信息都在这里配置，比如说网站名称，副标题，描述，作者，语言，主题等等。具体可以参考官方文档：https://hexo.io/zh-cn/docs/configuration.html。

scaffolds

骨架文件，是生成新页面或者新博客的模版。可以根据需求编辑，当`hexo`生成新博客的时候，会用这里面的模版进行初始化。

source

这个文件夹下面存放的是网站的`markdown`源文件，里面有一个`_post`文件夹，所有的`.md`博客文件都会存放在这个文件夹下。现在，你应该能看到里面有一个`hello-world.md`文件。

themes

网站主题目录，`hexo`有非常丰富的主题支持，主题目录会存放在这个目录下面。

我们后续会以默认主题来演示，更多的主题参见：https://hexo.io/themes/

#### config.yml

config.yml可以用WebStorm、VScode等软件打开，这里演示用VScode软件。

[VScode的下载](https://code.visualstudio.com/)

可以在这里配置网站名称、作者、标题、副标题等等。

我们打开博客、写博客都在博客文件夹的路径下输入cmd调用控制台窗口输入hexo命令语句

常用的有一下几种：

```
hexo clean #清理缓存
hexo new  "test1" # 会在 source/_posts/ 目录下生成生成名为“test1”的Markdown文件，在这里编辑博文
hexo g       # 生成静态HTML文件到 /public 文件夹中
hexo s       # 本地运行server服务预览，打开 http://localhost:4000 即可预览你的博客
hexo d 		 # 后文会说到
```

输入 hexo s 后会在本地生成预览链接



将网址复制到浏览器打开，就可以看见博客的初始效果



这里写一遍博客实例

紫色字体为文件路径，找到.md文件



后运行命令行窗口运行hexo命令

```
hexo clean
hexo g
hexo s
```

将生成的链接复制到浏览器打开，即可看见我们新写的博文：



#### 至此

我们完成了nodejs 的配置，使用npm包管理器部署了hexo,在本地预览并写新的博客。
