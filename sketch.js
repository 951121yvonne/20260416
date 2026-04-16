// ==========================================
// 114下學期 程式設計與實習 期中報告 - 數位藝術畫廊
// 學生：謝沐珊 (Yvonne) | 淡江教育科技系
// ==========================================

let projectsData = [];
let artworks = [];
let currentScrollX = 0;
let smoothedScrollX = 0;
let itemSpacing = 420;

let overlayDiv, iframeElement, closeButton;
let isOverlayOpen = false;

// 封面圖片變數
let img1, img2, img3, img4, img5;

function preload() {
  // 載入「封面」資料夾中的實體圖片
  img1 = loadImage('封面/1.png');
  img2 = loadImage('封面/2.png');
  img3 = loadImage('封面/3.png');
  img4 = loadImage('封面/4.png');
  img5 = loadImage('封面/5.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 定義資料與圖片對應 (包含心得卡與五件作品)
  projectsData = [
    { 
      title: "設計理念與技術說明", 
      date: "GUIDE", 
      note: "本展覽利用 p5.js 模擬 3D 空間。技術上使用 class 物件導向管理，背景運用 vertex 繪製透視網格。作品透過 iframe 嵌入呈現完整互動性。", 
      isReflection: true 
    },
    { date: "03/07", title: "色彩應用研究", url: "https://951121yvonne.github.io/03color/", img: img1, note: "運用 map 指令進行動態色彩映射。" },
    { date: "03/17", title: "基礎造型練習", url: "https://951121yvonne.github.io/0317/", img: img2, note: "練習 vertex 與 beginShape 的結構。" },
    { date: "03/24", title: "淡江水族箱", url: "https://951121yvonne.github.io/0324/", img: img3, note: "整合 class 與陣列控制動態生長。" },
    { date: "04/07-1", title: "電流急急棒", url: "https://951121yvonne.github.io/0407-1/", img: img4, note: "互動邏輯與物件碰撞偵測練習。" },
    { date: "04/07-2", title: "色塊獵人", url: "https://951121yvonne.github.io/0407-2/", img: img5, note: "滑鼠點擊判定與即時得分系統。" },
    { date: "Note", title: "開發筆記", url: "https://hackmd.io/@wTKBN8_3R_CaYngGb9pZrQ/SkVACRb2Wl", img: null, note: "詳細的程式碼分析與學習紀錄。" }
  ];

  // 初始化 Iframe 彈出視窗
  createIframeOverlay();

  // 初始化畫廊物件
  for (let i = 0; i < projectsData.length; i++) {
    artworks.push(new GalleryItem(i * itemSpacing, projectsData[i]));
  }
  
  textAlign(CENTER, CENTER);
  imageMode(CENTER);
}

function draw() {
  drawDarkGalleryBackground();

  // 捲動平滑化
  smoothedScrollX = lerp(smoothedScrollX, currentScrollX, 0.08);

  draw3DGrid();

  // 根據距離中心的遠近進行排序 (確保近的畫在遠的前面)
  let sortedArtworks = artworks.slice().sort((a, b) => b.getDistanceToCenter() - a.getDistanceToCenter());

  push();
  translate(width / 2, height / 2); 
  for (let artwork of sortedArtworks) {
    artwork.update(smoothedScrollX);
    if (!isOverlayOpen) artwork.checkMouseOver(mouseX - width/2, mouseY - height/2);
    artwork.display();
  }
  pop();

  drawHeaderAndFooter();
}

// --- Class: 畫廊物件管理 ---
class GalleryItem {
  constructor(x, data) {
    this.baseX = x;
    this.data = data;
    this.screenX = 0;
    this.scale = 1;
    this.alpha = 255;
    this.isHovered = false;
    this.w = data.isReflection ? 420 : 340;
    this.h = data.isReflection ? 260 : 210;
  }

  getDistanceToCenter() { return abs(this.screenX); }

  update(scrollX) {
    let relativeX = this.baseX - scrollX;
    this.scale = constrain(900 / (900 + abs(relativeX)), 0.35, 1.1);
    this.screenX = relativeX * this.scale * 0.85;
    this.alpha = map(this.scale, 0.35, 1, 30, 255);
  }
  
  checkMouseOver(mx, my) {
      let curW = this.w * this.scale;
      let curH = this.h * this.scale;
      this.isHovered = (mx > this.screenX - curW/2 && mx < this.screenX + curW/2 && my > -curH/2 && my < curH/2);
  }

  display() {
    push();
    translate(this.screenX, 0);
    scale(this.scale);
    
    if (this.isHovered && !this.data.isReflection) {
        scale(1.03);
        this.alpha = 255;
        cursor(HAND);
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = color(0, 255, 255);
    }

    // 畫框
    stroke(this.data.isReflection ? color(255, 215, 0, this.alpha) : color(255, this.alpha));
    strokeWeight(1.5);
    fill(10, this.alpha);
    rect(-this.w/2, -this.h/2, this.w, this.h, 5);

    if (this.data.isReflection) {
      this.drawReflection();
    } else {
      // 顯示封面圖片
      if (this.data.img) {
        tint(255, this.alpha);
        image(this.data.img, 0, -15, this.w - 20, this.h - 60);
        noTint();
      } else {
        fill(30, this.alpha);
        rect(-this.w/2+10, -this.h/2+10, this.w-20, this.h-70);
      }

      // 文字標籤
      noStroke();
      fill(0, 255, 255, this.alpha);
      textSize(14);
      text(this.data.date, -this.w/2 + 35, this.h/2 - 25);
      
      fill(255, this.alpha);
      textSize(18);
      textStyle(BOLD);
      text(this.data.title, 15, this.h/2 - 25);
    }
    pop();
    if(!this.isHovered && !isOverlayOpen) cursor(ARROW);
  }

  drawReflection() {
    fill(255, 215, 0, this.alpha);
    textSize(22); textStyle(BOLD);
    text(this.data.title, 0, -this.h/2 + 40);
    fill(230, this.alpha);
    textSize(15); textStyle(NORMAL);
    text(this.data.note, -this.w/2 + 30, -this.h/2 + 80, this.w - 60, this.h - 100);
    fill(255, 215, 0, 150);
    textSize(12); text("◀ 向右捲動觀展", 0, this.h/2 - 25);
  }
}

// --- 視窗邏輯：徹底修復刷新問題 ---
function createIframeOverlay() {
  overlayDiv = createDiv('');
  overlayDiv.style('position', 'fixed');
  overlayDiv.style('top', '0'); overlayDiv.style('left', '0');
  overlayDiv.style('width', '100%'); overlayDiv.style('height', '100%');
  overlayDiv.style('background-color', 'rgba(0, 0, 0, 0.98)');
  overlayDiv.style('display', 'none'); overlayDiv.style('z-index', '9999');
  overlayDiv.style('justify-content', 'center'); overlayDiv.style('align-items', 'center');
  overlayDiv.style('flex-direction', 'column');

  iframeElement = createElement('iframe');
  iframeElement.style('width', '90%'); iframeElement.style('height', '80%');
  iframeElement.style('border', '1px solid #444');
  iframeElement.parent(overlayDiv);
  
  // 使用 Div 模擬按鈕，徹底避開 <button> 標籤的刷新機制
  closeButton = createDiv('× 返回展廳 (CLOSE GALLERY)');
  closeButton.style('margin-top', '15px');
  closeButton.style('padding', '10px 40px');
  closeButton.style('color', '#0ff');
  closeButton.style('border', '1px solid #0ff');
  closeButton.style('cursor', 'pointer');
  closeButton.style('background', '#111');
  
  // 核心修正：阻止事件冒泡與預設行為
  closeButton.elt.onclick = function(e) {
      e.preventDefault(); 
      e.stopPropagation();
      closeProject();
      return false; 
  };
  closeButton.parent(overlayDiv);
}

function openProject(url) {
  isOverlayOpen = true;
  iframeElement.attribute('src', url);
  overlayDiv.style('display', 'flex');
}

function closeProject() {
  isOverlayOpen = false;
  overlayDiv.style('display', 'none'); 
  iframeElement.attribute('src', 'about:blank'); // 停止 iframe 內的程式執行
  cursor(ARROW);
}

// --- 滑鼠互動 ---
function mouseWheel(event) {
  if (isOverlayOpen) return;
  currentScrollX += event.delta * 0.8;
  currentScrollX = constrain(currentScrollX, -50, (artworks.length - 1) * itemSpacing + 100);
  return false; 
}

function mousePressed() {
    if (isOverlayOpen) return;
    for (let artwork of artworks) {
        if (artwork.isHovered && !artwork.data.isReflection) {
            openProject(artwork.data.url);
            break;
        }
    }
}

// --- 介面裝飾 ---
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function drawDarkGalleryBackground() {
  noStroke();
  for (let y = 0; y < height; y++) {
    stroke(lerpColor(color(5, 5, 15), color(25, 25, 40), y/height));
    line(0, y, width, y);
  }
}

function draw3DGrid() {
  push();
  translate(width / 2, height / 2);
  stroke(0, 255, 255, 15);
  for (let i = -10; i <= 10; i++) {
    let x = i * 200;
    line(x, 500, x * 0.05, 0); // 縱向線
    line(-2000, i * 50 + 200, 2000, i * 50 + 200); // 橫向線
  }
  pop();
}

function drawHeaderAndFooter() {
  noStroke();
  fill(255, 220); textSize(20); textStyle(BOLD);
  text("114 程式設計期中報告：數位藝術畫廊", width / 2, 40);
  fill(0, 255, 255, 150); textSize(12); textStyle(NORMAL);
  text("使用滑鼠滾輪移動展場 | 點擊畫框進入作品", width / 2, height - 30);
}