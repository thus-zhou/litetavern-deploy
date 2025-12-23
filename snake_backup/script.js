const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const restartBtn = document.getElementById('restartBtn');
const aiToggleBtn = document.getElementById('aiToggleBtn');
const aiConfigDiv = document.getElementById('aiConfig');
const aiUrlInput = document.getElementById('aiUrl');
const aiKeyInput = document.getElementById('aiKey');
const aiModelInput = document.getElementById('aiModel');
const saveAiConfigBtn = document.getElementById('saveAiConfig');

// 游戏设置
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let score = 0;
let maxLives = 10;
let lives = maxLives;

// AI 状态
let isAiMode = false;
let isAiThinking = false;
let aiConfig = {
    url: '',
    key: '',
    model: ''
};

// 蛇的初始状态
let snake = [
    { x: 10, y: 10 }, // 头
];
let dx = 0;
let dy = 0;
let inputQueue = []; // 输入缓冲队列

// 食物位置
let foodX = 5;
let foodY = 5;

// 游戏循环控制
let gameInterval;
let isGameRunning = false;

// 监听键盘事件
document.addEventListener('keydown', keyDownEvent);
restartBtn.addEventListener('click', resetGame);
aiToggleBtn.addEventListener('click', toggleAiConfig);
saveAiConfigBtn.addEventListener('click', startAiMode);

// 触摸滑动控制
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault(); // 防止滚动
}, {passive: false});

canvas.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    e.preventDefault();
}, {passive: false});

function handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    // 判断是水平滑动还是垂直滑动 (阈值 30px)
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
            if (diffX > 0) handleInput(39); // Right
            else handleInput(37); // Left
        }
    } else {
        if (Math.abs(diffY) > 30) {
            if (diffY > 0) handleInput(40); // Down
            else handleInput(38); // Up
        }
    }
}

// 虚拟按键绑定
document.getElementById('btnUp').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(38); });
document.getElementById('btnDown').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(40); });
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(37); });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(39); });
// 兼容鼠标点击（PC端测试用）
document.getElementById('btnUp').addEventListener('mousedown', () => handleInput(38));
document.getElementById('btnDown').addEventListener('mousedown', () => handleInput(40));
document.getElementById('btnLeft').addEventListener('mousedown', () => handleInput(37));
document.getElementById('btnRight').addEventListener('mousedown', () => handleInput(39));


function toggleAiConfig() {
    if (aiConfigDiv.style.display === 'none') {
        aiConfigDiv.style.display = 'block';
        isGameRunning = false; // 暂停游戏
    } else {
        aiConfigDiv.style.display = 'none';
    }
}

function startAiMode() {
    aiConfig.url = aiUrlInput.value;
    aiConfig.key = aiKeyInput.value;
    aiConfig.model = aiModelInput.value;

    if (!aiConfig.key) {
        alert('请输入 API Key');
        return;
    }

    isAiMode = true;
    aiConfigDiv.style.display = 'none';
    aiToggleBtn.innerText = '停止 AI';
    aiToggleBtn.onclick = stopAiMode;
    
    // 重置并开始
    resetGame();
}

function stopAiMode() {
    isAiMode = false;
    isAiThinking = false;
    aiToggleBtn.innerText = '启用 AI 托管';
    aiToggleBtn.onclick = toggleAiConfig;
    resetGame();
}

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    resetGameData();
    // 使用 requestAnimationFrame 或 setTimeout 替代 setInterval 以支持异步 AI
    gameTick();
}

function resetGame() {
    clearTimeout(gameInterval); // 清理旧的（如果有）
    isGameRunning = false;
    startGame();
}

function gameTick() {
    if (!isGameRunning) return;

    if (isAiMode) {
        // 优先消费队列中的指令
        if (inputQueue.length > 0) {
            gameLoop();
            // 快速执行队列中的指令 (50ms)
            gameInterval = setTimeout(gameTick, 50); 
        } 
        // 队列空了且没在思考，才请求 AI
        else if (!isAiThinking) {
            makeAiMove().then(() => {
                // AI 思考完可能填入了队列，立即执行
                gameTick();
            }).catch(err => {
                console.error('AI Error:', err);
                isAiThinking = false;
                gameInterval = setTimeout(gameTick, 1000);
            });
        } 
        // 正在思考中，等待
        else {
            gameInterval = setTimeout(gameTick, 100);
        }
    } else {
        // 普通模式
        gameLoop();
        gameInterval = setTimeout(gameTick, 100);
    }
}

function resetGameData() {
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    inputQueue = [];
    score = 0;
    lives = maxLives;
    scoreElement.innerText = score;
    livesElement.innerText = lives;
    placeFood();
}

function gameLoop() {
    if (hasGameEnded()) {
        clearTimeout(gameInterval);
        isGameRunning = false;
        alert(`游戏结束! 你的得分是: ${score}`);
        if (isAiMode) stopAiMode();
        return;
    }

    processInput();
    moveSnake();
    draw();
}

async function makeAiMove() {
    isAiThinking = true;
    
    // 构建 Prompt
    const prompt = getGameStatePrompt();
    
    try {
        const response = await fetch(aiConfig.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiConfig.key}`
            },
            body: JSON.stringify({
                model: aiConfig.model,
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert Snake game AI. Your goal is to survive and eat food.
Rules:
1. Grid is ${tileCount}x${tileCount} (0-${tileCount-1}).
2. Do NOT hit walls (x<0, x>=${tileCount}, y<0, y>=${tileCount}).
3. Do NOT hit your own body.
4. Move towards food if safe.
5. If trapped, find the longest path to survive.
6. Output ONLY one word: UP, DOWN, LEFT, or RIGHT.` 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 10
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].message.content.trim().toUpperCase();
            console.log("AI Response:", content);
            
            // 解析多步指令
            // 假设 AI 返回类似 "UP, LEFT, UP" 或 "UP LEFT UP"
            const moves = content.split(/[\s,]+/).filter(m => ["UP", "DOWN", "LEFT", "RIGHT"].includes(m));
            
            if (moves.length > 0) {
                // 清空旧输入，填入新的一批指令
                inputQueue = [];
                moves.forEach(move => {
                    if (move === "UP") inputQueue.push({ x: 0, y: -1 });
                    else if (move === "DOWN") inputQueue.push({ x: 0, y: 1 });
                    else if (move === "LEFT") inputQueue.push({ x: -1, y: 0 });
                    else if (move === "RIGHT") inputQueue.push({ x: 1, y: 0 });
                });
            }
        }
    } catch (error) {
        console.error("AI Request Failed:", error);
    } finally {
        isAiThinking = false;
    }
}

function getGameStatePrompt() {
    // 简单的 ASCII 地图辅助 AI 理解
    let gridMap = "";
    // 为了节省 token，我们只画蛇头周围 5x5 的区域，或者只提供关键坐标
    // 这里我们提供相对坐标和关键障碍物列表会更有效

    const head = snake[0];
    const bodyParts = snake.slice(1).map(p => `(${p.x},${p.y})`).join(" ");
    
    // 计算建议路径
    const suggestedPath = bfs(head, {x: foodX, y: foodY});
    const suggestion = suggestedPath.length > 0 
        ? `Suggested Path (BFS): ${suggestedPath.slice(0, 5).join(", ")}` 
        : "Suggested Path: No direct path found (Survive!)";

    return `
Current State:
- Grid Size: ${tileCount}x${tileCount}
- Head Position: (${head.x}, ${head.y})
- Food Position: (${foodX}, ${foodY})
- Current Direction: dx=${dx}, dy=${dy}
- Snake Body (Avoid these): ${bodyParts}

${suggestion}

Distance to Food:
- X-axis: ${foodX - head.x} (Negative: Left, Positive: Right)
- Y-axis: ${foodY - head.y} (Negative: Up, Positive: Down)

Immediate Surroundings (Safety Check):
- UP (${head.x}, ${head.y-1}): ${isSafe(head.x, head.y-1) ? "SAFE" : "DANGER"}
- DOWN (${head.x}, ${head.y+1}): ${isSafe(head.x, head.y+1) ? "SAFE" : "DANGER"}
- LEFT (${head.x-1}, ${head.y}): ${isSafe(head.x-1, head.y) ? "SAFE" : "DANGER"}
- RIGHT (${head.x+1}, ${head.y}): ${isSafe(head.x+1, head.y) ? "SAFE" : "DANGER"}

Based on the above, output a sequence of moves (up to 5) to reach the food. 
Format: A comma-separated list of moves (e.g., "UP, LEFT, UP").
`;
}

function isSafe(x, y) {
    // 撞墙
    if (x < 0 || x >= tileCount || y < 0 || y >= tileCount) return false;
    // 撞自己
    for (let i = 0; i < snake.length - 1; i++) { // 不用检查尾巴，因为移动后尾巴会移走
        if (x === snake[i].x && y === snake[i].y) return false;
    }
    return true;
}

function bfs(start, target) {
    let queue = [[start]];
    let visited = new Set();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
        let path = queue.shift();
        let head = path[path.length - 1];

        if (head.x === target.x && head.y === target.y) {
            // 找到路径，转换成方向指令
            return path.slice(1).map((node, index) => {
                let prev = path[index];
                if (node.x > prev.x) return "RIGHT";
                if (node.x < prev.x) return "LEFT";
                if (node.y > prev.y) return "DOWN";
                if (node.y < prev.y) return "UP";
            });
        }

        const directions = [
            { x: 0, y: -1 }, // UP
            { x: 0, y: 1 },  // DOWN
            { x: -1, y: 0 }, // LEFT
            { x: 1, y: 0 }   // RIGHT
        ];

        for (let dir of directions) {
            let next = { x: head.x + dir.x, y: head.y + dir.y };
            if (isSafe(next.x, next.y) && !visited.has(`${next.x},${next.y}`)) {
                visited.add(`${next.x},${next.y}`);
                queue.push([...path, next]);
            }
        }
    }
    return []; // 没找到路径
}

function processInput() {
    if (inputQueue.length > 0) {
        const nextMove = inputQueue.shift();
        
        // 如果是静止状态，直接接受
        if (dx === 0 && dy === 0) {
            dx = nextMove.x;
            dy = nextMove.y;
            return;
        }

        // 检查是否是反向移动 (掉头)
        if (nextMove.x === -dx && nextMove.y === -dy) {
            snake.reverse();
            dx = nextMove.x;
            dy = nextMove.y;
        } 
        // 正常转向 (非反向且非同向)
        else if (nextMove.x !== dx || nextMove.y !== dy) {
            dx = nextMove.x;
            dy = nextMove.y;
        }
    }
}

function draw() {
    // 清空画布
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画蛇
    ctx.fillStyle = 'green';
    snake.forEach((part, index) => {
        // 头部颜色略深
        if (index === 0) ctx.fillStyle = '#2E7D32';
        else ctx.fillStyle = '#4CAF50';
        
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // 画食物
    ctx.fillStyle = 'red';
    ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
}

function moveSnake() {
    // 如果没有移动，直接返回
    if (dx === 0 && dy === 0) return;

    const nextHead = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 检查是否即将撞墙
    if (nextHead.x < 0 || nextHead.x >= tileCount || nextHead.y < 0 || nextHead.y >= tileCount) {
        if (lives > 0) {
            lives--;
            livesElement.innerText = lives;
            // 撞墙反弹（掉头）
            snake.reverse();
            dx = -dx;
            dy = -dy;
            // 反向后，为了不让蛇停顿，我们可以尝试立即向反方向走一步
            // 但如果反向后的位置也不合法（理论上不太可能，除非蛇身填满了死胡同），那就得小心
            // 简单起见，这一帧只转向，不移动，给玩家反应时间
            return;
        }
        // 如果没有机会了，允许移动（然后会在 hasGameEnded 里判定死亡）
        // 或者直接在这里判定也可以，但为了保持一致性，我们让它走出去，然后在 hasGameEnded 里死
    }

    snake.unshift(nextHead);

    // 检查是否吃到食物
    if (nextHead.x === foodX && nextHead.y === foodY) {
        score += 10;
        scoreElement.innerText = score;
        placeFood();
        // 吃到食物后，原来的路径可能不是最优了（或者需要重新规划去新食物的路）
        // 清空队列，强制 AI 重新思考
        if (isAiMode) {
            inputQueue = [];
        }
    } else {
        // 如果没吃到，移除尾部
        snake.pop();
    }
}

function hasGameEnded() {
    const head = snake[0];
    
    // 如果刚开始还没动，不判输
    if (dx === 0 && dy === 0) return false;

    // 撞墙检测 (如果 lives 用完，moveSnake 会允许蛇出界，这里捕获出界)
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }

    // 撞自己
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

function placeFood() {
    foodX = Math.floor(Math.random() * tileCount);
    foodY = Math.floor(Math.random() * tileCount);

    // 确保食物不生成在蛇身上
    snake.forEach(part => {
        if (part.x === foodX && part.y === foodY) {
            placeFood();
        }
    });
}

function keyDownEvent(e) {
    // 防止按键导致页面滚动
    if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
    handleInput(e.keyCode);
}

function handleInput(keyCode) {
    const keyMap = {
        37: { x: -1, y: 0 }, // Left
        38: { x: 0, y: -1 }, // Up
        39: { x: 1, y: 0 },  // Right
        40: { x: 0, y: 1 }   // Down
    };

    const move = keyMap[keyCode];
    if (move) {
        // 限制队列长度，防止输入积压过多
        if (inputQueue.length < 3) {
            // 如果队列为空，比较是否与当前方向相同，避免重复添加同方向
            // 如果队列不为空，比较是否与队尾方向相同
            const lastMove = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { x: dx, y: dy };
            if (move.x !== lastMove.x || move.y !== lastMove.y) {
                inputQueue.push(move);
            }
        }
    }
}

// 自动开始
startGame();
