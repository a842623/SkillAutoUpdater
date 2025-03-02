import { eventSource, event_types } from "../../../../script.js";

eventSource.on(event_types.MESSAGE_RECEIVED, handleMessage);

function handleMessage(data) {
    const message = data.message;
    const pattern = /状态：([A-Z]+)级技能“(.+?)”，熟练度(.+?)（(\d+\.?\d*)\/(\d+)）/g;
    let match;
    while ((match = pattern.exec(message)) !== null) {
        const skillLevel = match[1];
        const skillName = match[2];
        const skillProficiency = match[3];
        const skillCurrent = match[4];
        const skillMax = match[5];
        updateWorldbook(skillName, skillLevel, skillProficiency, skillCurrent, skillMax);
    }
}

async function updateWorldbook(skillName, skillLevel, skillProficiency, skillCurrent, skillMax) {
    // 获取世界书数据
    const worldbook = await fetchWorldbook();
    let content = worldbook.entries["15"].content;

    // 计算加成和成功率
    let successRate, bonus;
    if (skillProficiency.includes("未入门")) { successRate = "0%"; bonus = "+0"; }
    else if (skillProficiency.includes("入门")) { successRate = "30%"; bonus = "+6"; }
    else if (skillProficiency.includes("小成")) { successRate = "50%"; bonus = "+8"; }
    else if (skillProficiency.includes("精通")) { successRate = "90%"; bonus = "+11"; }
    else if (skillProficiency.includes("大成")) { successRate = "100%"; bonus = "+12"; }
    else if (skillProficiency.includes("圆满")) { successRate = "100%"; bonus = "+18"; }
    else { successRate = "unknown%"; bonus = "+0"; }

    const newSkillLine = `${skillName}（${skillProficiency}，${skillCurrent}/${skillMax}）：${bonus}，成功率${successRate}`;

    if (!content.includes(skillName)) {
        const levelKey = `${skillLevel}级技能`;
        content += content.includes(levelKey) ? `\n${newSkillLine}` : `\n${levelKey}\n${newSkillLine}`;
        worldbook.entries["15"].content = content;
        await saveWorldbook(worldbook);
        console.log(`已添加技能：${newSkillLine}`);
    }
}

// 世界书读写函数（需替换为实际API或文件操作）
async function fetchWorldbook() {
    const response = await fetch("/api/world_info/get"); // SillyTavern API端点
    return await response.json();
}

async function saveWorldbook(worldbook) {
    await fetch("/api/world_info/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(worldbook.entries["15"])
    });
}
