// 站点全局信息：改名、改简介、改链接，只动这一个文件
export const SITE = {
  name: '子諭',
  title: '子諭的平凡日记',
  tagline: '读书 学习 去更远的地方',
  description: '子諭的个人网站：学习笔记、随笔与生活记录。',
  avatar: '/images/111.jpg',
  email: '1025490868@qq.com',
  github: 'https://github.com/Ziyu09',
  // ICP 备案号：备案通过后填这里，例如 '京ICP备2026000000号-1'。留空则不显示。
  icp: '',
};

// 首页自我介绍，想改就改这里的段落
export const INTRO = [
  '你好，我是子諭。',
  '这里有两个入口：一边记录我的平凡日常，一边收藏我们的故事。',
];

// 进站问题：答对才能进入站点（前端简单遮挡，不是真正的安全防护）
export const GATE = {
  question: '小全的生日',
  answer: '0206',
  hint: '四位数，月和日',
};

// ---------- 入口一：平凡日记 ----------
export const DIARY = {
  eyebrow: '01 / 个人记录',
  title: '子諭的平凡日记',
  subtitle: '读书 · 学习 · 去更远的地方',
  description: '学习笔记、技术积累，还有一些生活里的碎碎念。',
  href: '/blog/',
};

// ---------- 入口二：我们的故事 ----------
export const STORY = {
  eyebrow: '02 / 爱情记录',
  title: '记录我们的故事',
  subtitle: '把两个人的日子，慢慢收在这里',
  description: '照片、视频，还有那些不想忘记的瞬间。',
  href: '/story/',
  // 改成你们在一起的那一天，首页会显示「在一起 X 天」
  since: '2021-11-01',
};

// 故事开始的时间（时间轴的起点）
export const STORY_START = '2021.11';

// 时间轴：往数组里按时间顺序加事件即可，date 写 '2022.03' 这样的年月
export const TIMELINE: { date: string; title: string; text?: string }[] = [];

// 故事页顶部的照片拼图（放 2~4 张合照最好看）
export const STORY_HERO_PHOTOS = [
  '/images/21.jpg',
  '/images/20.jpg',
  '/images/3.jpg',
  '/images/5.jpg',
];

// 照片墙：换成你们的照片，改 src 和 caption 即可
export const PHOTOS = [
  { src: '/images/21.jpg', caption: '一起看过的城市' },
  { src: '/images/3.jpg', caption: '黄昏的时候' },
  { src: '/images/5.jpg', caption: '夜里的灯火' },
  { src: '/images/8.jpg', caption: '走过的街角' },
  { src: '/images/20.jpg', caption: '楼顶的晚风' },
  { src: '/images/19.jpg', caption: '回家的路' },
];

// 视频区：把 mp4 放进 public/videos/，再在这里登记，例如
// { title: '第一次一起旅行', src: '/videos/travel.mp4', poster: '/images/21.jpg' }
export const VIDEOS: { title: string; src: string; poster?: string }[] = [];
