document.addEventListener('DOMContentLoaded', async function() {
    const supabase = supabase.createClient(
        'YOUR_SUPABASE_URL',
        'YOUR_SUPABASE_KEY'
    );

    // 检查用户当前的订阅状态
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // 获取用户的订阅信息
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // 根据用户的订阅状态禁用相应的按钮
            if (subscription) {
                const currentPlan = subscription.plan;
                const buttons = document.querySelectorAll('.plan-button');
                
                buttons.forEach(button => {
                    if (button.parentElement.parentElement.classList.contains(currentPlan)) {
                        button.disabled = true;
                        button.textContent = 'Current Plan';
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const currencyToggle = document.getElementById('currencyToggle');
    
    // 设置初始货币（默认RMB）
    updatePricesDisplay(false);

    // 监听货币切换
    currencyToggle.addEventListener('change', function() {
        const isUSD = this.checked;
        updatePricesDisplay(isUSD);
    });

    // 为所有升级按钮添加点击事件
    document.querySelectorAll('.plan-button').forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', function() {
                const planType = this.closest('.plan-card').classList.contains('pro') ? 'pro' : 'ultimate';
                const isUSD = currencyToggle.checked;
                handlePayment(planType, isUSD);
            });
        }
    });
});

// 处理支付
function handlePayment(planType, isUSD) {
    if (isUSD) {
        handlePayPalPayment(planType);
    } else {
        showChinesePayment(planType);
    }
}

// PayPal支付处理
function handlePayPalPayment(planType) {
    // 创建 PayPal 支付弹窗
    const paypalModal = document.createElement('div');
    paypalModal.className = 'payment-modal paypal-modal';
    paypalModal.innerHTML = `
        <div class="modal-content">
            <h3>PayPal Checkout</h3>
            <div id="paypal-button-container"></div>
            <button class="close-modal" onclick="this.closest('.payment-modal').remove()">Cancel</button>
        </div>
    `;
    document.body.appendChild(paypalModal);

    // 这里添加 PayPal 按钮初始化代码
    // PayPal 集成代码...
}

// 中国支付方式
function showChinesePayment(planType) {
    // 创建支付弹窗
    const paymentModal = document.createElement('div');
    paymentModal.className = 'payment-modal chinese-payment-modal';
    paymentModal.innerHTML = `
        <div class="modal-content">
            <h3>请选择支付方式</h3>
            <div class="payment-tabs">
                <div class="tab active" data-tab="wechat">微信支付</div>
                <div class="tab" data-tab="alipay">支付宝</div>
            </div>
            <div class="qr-container">
                <img id="qrCode" src="path/to/wechat-qr.jpg" alt="支付二维码">
                <p class="price">${planType === 'pro' ? '￥10' : '￥20'}/月</p>
            </div>
            <div class="payment-instructions">
                <p>1. 请使用微信/支付宝扫描二维码</p>
                <p>2. 完成支付后请点击"我已支付"</p>
                <p>3. 等待系统确认（1-3分钟）</p>
            </div>
            <div class="payment-actions">
                <button onclick="checkPaymentStatus()">我已支付</button>
                <button onclick="this.closest('.payment-modal').remove()">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(paymentModal);

    // 添加支付方式切换逻辑
    const tabs = paymentModal.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // 更新二维码
            const qrCode = document.getElementById('qrCode');
            qrCode.src = `path/to/${tab.dataset.tab}-qr.jpg`;
        });
    });
}

// 更新价格显示
function updatePricesDisplay(isUSD) {
    const priceMapping = {
        'free': { rmb: '¥0', usd: '$0' },
        'pro': { rmb: '¥10', usd: '$4.99' },
        'ultimate': { rmb: '¥20', usd: '$9.99' }
    };

    document.querySelectorAll('.plan-card').forEach(card => {
        const priceElement = card.querySelector('.price');
        const planType = card.classList.contains('pro') ? 'pro' : 
                        card.classList.contains('ultimate') ? 'ultimate' : 'free';
        
        const prices = priceMapping[planType];
        priceElement.innerHTML = `${isUSD ? prices.usd : prices.rmb}<span>/month</span>`;
    });
}

// 处理支付按钮点击
function handlePayment(planType) {
    // 检查当前货币类型
    const isUSD = document.getElementById('currencyToggle').checked;
    const paymentModal = createPaymentModal(planType, isUSD);
    document.body.appendChild(paymentModal);
    
    // 添加点击空白处关闭功能
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.remove();
        }
    });

    initializePaymentMethods(planType, isUSD);
}

// 创建支付弹窗
function createPaymentModal(planType, isUSD) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    
    const prices = {
        pro: isUSD ? { value: 15, symbol: '$' } : { value: 99, symbol: '¥' },
        ultimate: isUSD ? { value: 29, symbol: '$' } : { value: 199, symbol: '¥' }
    };

    const price = prices[planType];

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isUSD ? 'Choose Payment Method' : '选择支付方式'}</h3>
                <button class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="price-summary">
                <h4>${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan</h4>
                <div class="price">${price.symbol}${price.value}/month</div>
            </div>

            <div class="payment-methods">
                ${isUSD ? `
                    <div class="payment-method paypal" data-method="paypal">
                        <i class="fab fa-paypal"></i>
                        <span>PayPal</span>
                    </div>
                    
                    <div class="payment-method card" data-method="stripe">
                        <i class="far fa-credit-card"></i>
                        <span>Credit Card</span>
                    </div>
                ` : `
                    <div class="payment-method wechat" data-method="wechat">
                        <i class="fab fa-weixin"></i>
                        <span>微信支付</span>
                    </div>
                    
                    <div class="payment-method alipay" data-method="alipay">
                        <svg class="alipay-icon" viewBox="0 0 1024 1024">
                            <path d="M992 725.333333c0 146.432-118.901333 264.96-265.813333 264.96H297.813333C150.901333 990.293333 32 871.765333 32 725.333333V297.813333C32 151.381333 150.901333 32.853333 297.813333 32.853333h428.373334C873.098667 32.853333 992 151.381333 992 297.813333v427.52z m-139.776-44.373333c-36.266667-15.36-83.626667-36.266667-137.813333-60.586667 28.16-48.64 51.2-103.253333 66.56-163.84h-190.293334v-51.2h235.52v-30.72h-235.52v-85.333333h-95.573333v85.333333h-247.466667v30.72h247.466667v51.2h-193.706667v30.72h372.053334c-12.8 43.52-30.72 84.48-53.76 120.746667-93.866667-30.72-190.293333-71.68-247.466667-100.693333-15.36 17.066667-45.226667 43.52-59.733333 55.466666 93.866667 41.813333 235.52 100.693333 324.266666 128.853334-59.733333 71.68-244.053333 128.853333-397.653333 154.453333 12.8 17.066667 34.56 59.733333 42.666667 81.92 167.253333-34.56 381.44-103.253333 459.093333-205.653333 48.64 103.253333 290.133333 172.8 421.546667 205.653333 8.96-22.186667 29.866667-64.853333 43.52-81.92-116.341333-22.186667-319.146667-81.92-386.56-164.266667z" fill="currentColor"/>
                        </svg>
                        <span>支付宝</span>
                    </div>
                `}
            </div>

            <div id="payment-button-container"></div>
        </div>
    `;

    return modal;
}

// 初始化支付方法
function initializePaymentMethods(planType, isUSD) {
    const paymentMethods = document.querySelectorAll('.payment-method');
    const buttonContainer = document.getElementById('payment-button-container');

    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            
            const paymentMethod = method.dataset.method;
            if (isUSD) {
                if (paymentMethod === 'paypal') {
                    initializePayPalButton(planType, buttonContainer);
                } else if (paymentMethod === 'stripe') {
                    initializeStripeButton(planType, buttonContainer);
                }
            } else {
                if (paymentMethod === 'wechat') {
                    showWeChatQRCode(planType, buttonContainer);
                } else if (paymentMethod === 'alipay') {
                    showAlipayQRCode(planType, buttonContainer);
                }
            }
        });
    });

    // 默认选中第一个支付方式
    paymentMethods[0].click();
}

// 初始化 PayPal 按钮
function initializePayPalButton(planType, container) {
    const prices = {
        pro: 15,
        ultimate: 29
    };

    container.innerHTML = '';
    
    paypal.Buttons({
        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: prices[planType]
                    }
                }]
            });
        },
        onApprove: async (data, actions) => {
            try {
                const order = await actions.order.capture();
                await handleSuccessfulPayment(planType, 'paypal', order);
            } catch (error) {
                console.error('Payment failed:', error);
                showError('Payment failed. Please try again.');
            }
        }
    }).render(container);
}

// 初始化 Stripe 按钮
function initializeStripeButton(planType, container) {
    container.innerHTML = `
        <button id="stripe-button" class="stripe-pay-button">
            Pay with Card
        </button>
    `;

    const stripeButton = document.getElementById('stripe-button');
    stripeButton.addEventListener('click', () => {
        handleStripePayment(planType);
    });
}

// Stripe 支付处理
async function handleStripePayment(planType) {
    try {
        const stripe = Stripe('your_publishable_key');
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planType: planType
            }),
        });

        const session = await response.json();
        const result = await stripe.redirectToCheckout({
            sessionId: session.id,
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Payment failed:', error);
        showError('Payment failed. Please try again.');
    }
}

// 处理成功支付
async function handleSuccessfulPayment(planType, paymentMethod, orderDetails) {
    try {
        // 调用后端 API 更新用户订阅状态
        await fetch('/api/update-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planType,
                paymentMethod,
                orderDetails
            }),
        });

        // 显示成功消息
        showSuccess('Payment successful! Upgrading your account...');
        
        // 延迟后刷新页面或重定向
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error('Error updating subscription:', error);
        showError('Payment successful but failed to upgrade. Please contact support.');
    }
}

