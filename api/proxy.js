export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, mealPlan, needDelivery } = req.body;
  if (!message) return res.status(400).json({ error: '缺少消息内容' });

  const DEEPSEEK_API_KEY = 'sk-7d0f65749ab54b91bb4530c8797caafc';
  const SYSTEM_PROMPT = `你是NutriBox的AI营养师，专门为用户生成个性化一周食谱。

【最高优先级：医疗红线】
用户填写"特殊健康状况"字段时，如果包含以下任意一类内容，你必须立刻停止生成食谱，只输出固定话术：
- 任何疾病名称（如糖尿病、高血压、高血脂、痛风、肾病、抑郁症等）
- 任何药物描述（如服用XX药、注射胰岛素等）
- 孕产期、备孕期、哺乳期
- 术后恢复期
固定话术：
"检测到您填写的健康状况涉及医疗范畴。为确保您的安全，NutriBox AI 无法为您自动生成食谱。请务必先咨询专业医生或临床营养师，根据医嘱调整饮食。感谢您的理解。"

【饮食标签识别（以下情况不拒绝服务，但必须严格遵守）】
- 纯素：禁止一切动物来源食材，包括肉、禽、鱼、虾蟹贝类、蛋、奶、蜂蜜。蛋白质必须来自豆腐、豆类、鹰嘴豆、藜麦、面筋、植物蛋白粉。
- 鱼素：禁止禽畜肉，但可用鱼、虾蟹贝类、蛋、奶。
- 乳糖不耐/牛奶过敏：禁止牛奶、酸奶、乳清蛋白、芝士、黄油及含乳制品。
- 无特殊饮食标签则按正常饮食处理。

【工作流程】
1. 接收用户信息：性别、年龄、身高、体重、目标、过敏源、禁忌、口味偏好、活动水平、特殊健康状况。
2. 第一时间检查"特殊健康状况"，若触发医疗红线，立即返回固定话术，不执行任何后续步骤。
3. 若未触发红线，计算BMI，然后根据目标设定每日总热量：
   - 减脂：BMR × 活动系数 × 0.8~0.9
   - 增肌：BMR × 活动系数 × 1.1~1.2
   - 维持：BMR × 活动系数 × 1.0
   （活动系数：久坐不动/几乎不运动=1.2，中等活动=1.5，高强度训练=1.7）
4. 生成7天食谱（周一至周日），用户指定5天则生成周一至周五。

【食谱生成规则】
- 食材常见易购，彻底避开用户填写的过敏源和饮食禁忌。
- 每餐格式：菜名 + 主要食材及用量 + 热量(kcal) + 蛋白质(g) + 碳水(g) + 脂肪(g)。
- 烹饪方式：
   - 减脂 + 清淡：限蒸、煮、白灼、轻煎，每餐用油 ≤3g，不辣。
   - 增肌 + 辣：可用辣椒、花椒、剁椒等，但不得使用黄油、奶油等违禁食材。
- 主蛋白源多样性：一周内午餐和晚餐的主蛋白源重复不超过2次（豆腐除外）。
- 减脂蛋白质优先：鱼、虾、鸡胸、豆腐，猪肉仅限里脊且每周 ≤1次。
- 三餐热量默认比例：早餐30%、午餐40%、晚餐30%。

【输出格式 - 必须严格使用以下Markdown排版】

## 📋 您的专属7日营养方案

> **总热量：** XXXX kcal/天  
> **BMI：** XX.X（偏瘦/正常/偏胖）  
> **目标：** 减脂/增肌/维持  
> **原则：** 高蛋白、低GI、清淡烹饪

---

### 🟢 周一

**🌅 早餐**
- **菜名：** 蒸鸡蛋羹+全麦吐司+烫菠菜  
- **食材：** 鸡蛋2个、全麦吐司1片、菠菜100g  
- **热量：** 405 kcal | 蛋白质 22g | 碳水 25g | 脂肪 21g

**🌞 午餐**
- **菜名：** 白灼基围虾+杂粮饭+清煮娃娃菜  
- **食材：** 基围虾120g、糙米饭60g、娃娃菜150g  
- **热量：** 544 kcal | 蛋白质 33g | 碳水 48g | 脂肪 21g

**🌙 晚餐**
- **菜名：** 嫩豆腐煮菌菇+蒸南瓜  
- **食材：** 北豆腐150g、香菇50g、南瓜150g  
- **热量：** 407 kcal | 蛋白质 17g | 碳水 54g | 脂肪 11g

---

*（周二至周日格式同上）*

⚠️ 以上食谱由 NutriBox AI 生成，仅供健康人群参考，不构成医疗建议。  
📱 觉得做饭麻烦？NutriBox 已根据您的专属食谱搭配好本周营养餐盒，点击下方了解订阅服务。`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const reply = data.choices?.[0]?.message?.content || '';

    // ---------- 内置食材价格与计算逻辑 ----------
    const PRICE_CONFIG = {
      ingredients: {
        '鸡蛋': 1.5, '全麦吐司': 0.8, '菠菜': 1.2, '基围虾': 4.5, '糙米饭': 2.0,
        '娃娃菜': 0.8, '鸡胸肉': 2.5, '西兰花': 1.8, '巴沙鱼': 3.5, '生菜': 1.0,
        '山药': 1.5, '南瓜': 1.0, '燕麦': 1.5, '猪里脊': 3.0, '龙利鱼': 3.8,
        '鱿鱼': 4.0, '鳕鱼': 5.0, '北豆腐': 0.8, '香菇': 2.5, '金针菇': 1.5,
        '虾仁': 5.0, '瘦牛肉': 4.5, '藜麦': 2.5, '红薯': 0.8, '紫薯': 1.0,
        '玉米': 1.2, '小米': 1.0, '全麦面包': 1.0, '无糖豆浆': 1.5, '低脂牛奶': 2.0,
        '无糖酸奶': 2.5, '希腊酸奶': 3.0, '牛肉': 5.0, '面筋': 1.0, '鹰嘴豆': 1.2,
        '黑豆': 1.0, '白芸豆': 1.0, '红腰豆': 1.0, '豆腐皮': 1.5, '花豆': 1.0,
        '豌豆': 1.0, '土豆': 0.8, '茄子': 1.0, '西葫芦': 1.0, '胡萝卜': 0.8,
        '芹菜': 0.8, '青椒': 1.5, '苦菊': 1.2, '茼蒿': 1.2, '油麦菜': 1.0,
        '菜心': 1.2, '芥兰': 1.5, '芦笋': 3.0, '秋葵': 2.5, '荷兰豆': 2.5,
        '冬瓜': 0.8, '丝瓜': 1.2, '番茄': 1.0, '木耳': 2.0, '海带': 1.0,
        '紫菜': 1.5, '苹果': 1.5, '蓝莓': 3.0, '奇异果': 1.8, '核桃': 4.0,
        '巴旦木': 5.0, '杏仁': 4.5, '普通食用油': 2.0, '橄榄油': 3.5
      },
      defaultPrice: 1.5,
      packingFee: 5,
      profitRate: 1.5,
      deliveryFee: 15
    };

    function parseIngredients(text) {
      const lines = text.split('\n');
      const map = {};
      lines.forEach(line => {
        const m = line.match(/食材：(.+)/);
        if (m) {
          m[1].split('、').forEach(item => {
            const parts = item.trim().match(/^([\u4e00-\u9fa5a-zA-Z]+)(\d+)\s*(g|克|个|片|根|ml|毫升)?$/i);
            if (parts) {
              const name = parts[1].trim();
              const amount = parseFloat(parts[2]);
              const unit = (parts[3] || 'g').toLowerCase();
              if (!map[name]) map[name] = { amount: 0, unit };
              map[name].amount += amount;
            }
          });
        }
      });
      return map;
    }

    function getIngredientPrice(name) {
      if (PRICE_CONFIG.ingredients[name] !== undefined) return PRICE_CONFIG.ingredients[name];
      for (let key in PRICE_CONFIG.ingredients) {
        if (name.includes(key) || key.includes(name)) return PRICE_CONFIG.ingredients[key];
      }
      return PRICE_CONFIG.defaultPrice;
    }

    function calcFoodCost(map) {
      let total = 0;
      for (let name in map) {
        const { amount, unit } = map[name];
        const price = getIngredientPrice(name);
        if (unit === 'g' || unit === '克' || unit === 'ml' || unit === '毫升') {
          total += (price * amount) / 100;
        } else {
          total += price * amount;
        }
      }
      return total;
    }

    const ingredientMap = parseIngredients(reply);
    const foodCost = calcFoodCost(ingredientMap);
    const mealMapping = {
      '仅早餐': 1, '仅午餐': 1, '仅晚餐': 1,
      '早餐+午餐': 2, '午餐+晚餐': 2, '早餐+晚餐': 2, '三餐全包': 3
    };
    const dailyMeals = mealMapping[mealPlan] || 0;
    const totalMeals = dailyMeals * 5;
    const packingTotal = totalMeals * PRICE_CONFIG.packingFee;
    const subtotal = (foodCost + packingTotal) * PRICE_CONFIG.profitRate;
    const deliveryTotal = (needDelivery === '是') ? PRICE_CONFIG.deliveryFee * 5 : 0;
    const finalPrice = Math.round(subtotal + deliveryTotal);

    const priceData = {
      foodCost: foodCost.toFixed(1),
      packingTotal,
      deliveryTotal,
      finalPrice
    };

    // 存储完整记录到 Upstash
    const record = {
      timestamp: new Date().toISOString(),
      userMessage: message,
      generatedReply: reply,
      mealPlan: mealPlan || '未提供',
      needDelivery: needDelivery || '否',
      price: priceData
    };

    const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (UPSTASH_URL && UPSTASH_TOKEN) {
      try {
        await fetch(`${UPSTASH_URL}/lpush/nutribox_submissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ element: JSON.stringify(record) })
        });
      } catch (e) {
        console.error('Redis write failed:', e);
      }
    }

    // 邮件通知（可选）
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer re_VYNMi7cc_255UjpyPfWJEpjfgEP7oQiy3`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'NutriBox <onboarding@resend.dev>',
          to: '1225335839@qq.com',
          subject: 'NutriBox 新订单',
          html: `<pre>${JSON.stringify(record, null, 2)}</pre>`
        })
      });
    } catch (e) {
      console.error('Email failed:', e);
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: '服务器内部错误：' + error.message });
  }
}