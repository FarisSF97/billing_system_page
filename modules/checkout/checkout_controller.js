const path = require('path');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5100';

function generateRandomPassword(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const index = async (req,res) => {
    res.render('checkout/index', { user: req.session.user });
};

const processPayment = async (req, res) => {
    try {
        const { 
            email, 
            whatsapp,
            cardName, 
            cardNumber,
            productName, 
            quantity, 
            subtotal, 
            discount, 
            totalPrice,
            originalProduct,
            isLifetime,
            currentLifetimeSlug,
            expiry,
            coupon
        } = req.body;
        
        const cardExpiry = expiry || '';  // Keep MM/YY format with slash
        
        const productSlug = isLifetime && currentLifetimeSlug ? currentLifetimeSlug : originalProduct?.slug;
        
        const currentUser = req.session.user;
        
        const checkoutPayload = {
            nama: cardName || email.split('@')[0],
            email: email,
            no_wa: whatsapp || '',
            password: '',
            payment_method: 'card',
            product_id: productSlug,
            qty: parseInt(quantity) || 1,
            kupon: req.body.coupon || '',
            product_name: productName,
            harga: originalProduct?.harga || subtotal / quantity,
            account_id: currentUser?.id || null,
            cardName: cardName,
            cardNumber: cardNumber || '',
            cardExpiry: cardExpiry || ''
        };
        
        const apiResponse = await axios.post(`${API_BASE_URL}/checkout`, checkoutPayload);
        
        if (apiResponse.data.status !== 'success') {
            return res.status(apiResponse.data.code || 400).render('checkout/index', {
                error: apiResponse.data.message || 'Checkout failed',
                user: req.session.user
            });
        }
        
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = apiResponse.data.data?.order_id || Math.floor(Math.random() * 999) + 1;
        const invoiceNumber = `INV-${dateStr}-${randomSuffix}-${orderNumber.toString().padStart(3, '0')}`;
        
        res.render('checkout/thankyou', {
            invoiceNumber,
            productName,
            quantity: parseInt(quantity),
            subtotal: parseInt(subtotal),
            discount: parseInt(discount) || 0,
            totalPrice: parseInt(totalPrice),
            user: req.session.user,
            whatsapp: whatsapp,
            orderId: apiResponse.data.data?.order_id
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        const errorMessage = error.response?.data?.message || 'Payment processing failed. Please try again.';
        res.status(error.response?.status || 500).render('checkout/index', {
            error: errorMessage,
            user: req.session.user
        });
    }
};

const thankYou = async (req, res) => {
    res.render('checkout/thankyou', { user: req.session.user });
};

const atmEmail = async (req, res) => {
    res.render('checkout/atm_email', { user: req.session.user });
};

const atmBanks = async (req, res) => {
    res.render('checkout/atm_banks', { user: req.session.user });
};

const atmVA = async (req, res) => {
    res.render('checkout/atm_va', { user: req.session.user });
};

const processBankPayment = async (req, res) => {
    try {
        const {
            nama,
            email,
            whatsapp,
            productSlug,
            productName,
            quantity,
            subtotal,
            discount,
            totalPrice,
            isLifetime,
            paymentMethod,
            bankName,
            bankAccount,
            bankOwner,
            kupon
        } = req.body;

        const currentUser = req.session.user;

        const checkoutPayload = {
            nama: nama || email.split('@')[0],
            email: email,
            no_wa: whatsapp || '',
            password: generateRandomPassword(8),
            payment_method: paymentMethod || 'bank_transfer',
            product_id: productSlug,
            qty: parseInt(quantity) || 1,
            kupon: kupon || '',
            account_id: currentUser?.id || null,
            cardName: '',
            cardNumber: '',
            cardExpiry: ''
        };

        const apiResponse = await axios.post(`${API_BASE_URL}/checkout`, checkoutPayload);

        if (apiResponse.data.status !== 'success') {
            return res.status(apiResponse.data.code || 400).json({
                status: 'failed',
                message: apiResponse.data.message || 'Checkout failed'
            });
        }

        const now = new Date();
        const dateStr = now.getFullYear().toString() +
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderNumber = apiResponse.data.data?.order_id || Math.floor(Math.random() * 999) + 1;
        const invoiceNumber = `INV-${dateStr}-${randomSuffix}-${orderNumber.toString().padStart(3, '0')}`;

        // Payment deadline: 24 hours from now
        const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const deadlineStr = deadline.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        res.json({
            status: 'success',
            data: {
                invoiceNumber,
                productName,
                quantity: parseInt(quantity),
                subtotal: parseInt(subtotal),
                discount: parseInt(discount) || 0,
                totalPrice: parseInt(totalPrice),
                orderId: apiResponse.data.data?.order_id,
                bankName: bankName || 'Bank Jago',
                bankAccount: bankAccount || '1234567890',
                bankOwner: bankOwner || 'PT. Star Frost',
                paymentDeadline: deadlineStr
            }
        });
    } catch (error) {
        console.error('Bank payment processing error:', error);
        const errorMessage = error.response?.data?.message || 'Payment processing failed. Please try again.';
        res.status(error.response?.status || 500).json({
            status: 'failed',
            message: errorMessage
        });
    }
};

module.exports = {
    index,
    processPayment,
    processBankPayment,
    thankYou,
    atmEmail,
    atmBanks,
    atmVA
};
