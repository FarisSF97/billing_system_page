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
        
        const apiData = apiResponse.data.data || {};
        const invoiceNumber = apiData.invoice || '';
        const harga = parseInt(originalProduct?.harga) || (parseInt(subtotal) / parseInt(quantity)) || 0;
        
        res.render('checkout/thankyou', {
            invoiceNumber,
            productName,
            quantity: parseInt(quantity),
            harga: harga,
            subtotal: parseInt(subtotal),
            discount: parseInt(discount) || 0,
            totalPrice: parseInt(totalPrice),
            user: req.session.user,
            whatsapp: whatsapp,
            orderId: apiData.order_id,
            generatedPassword: apiData.generated_password || null,
            generatedEmail: apiData.generated_email || null
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

        const apiData = apiResponse.data.data || {};
        const invoiceNumber = apiData.invoice || '';

        // Payment deadline: 24 hours from now
        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const deadlineStr = deadline.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const harga = parseInt(subtotal) / parseInt(quantity) || 0;

        res.json({
            status: 'success',
            data: {
                invoiceNumber,
                productName,
                quantity: parseInt(quantity),
                harga: harga,
                subtotal: parseInt(subtotal),
                discount: parseInt(discount) || 0,
                totalPrice: parseInt(totalPrice),
                orderId: apiData.order_id,
                bankName: apiData.bank_name || bankName || 'Jago Syariah',
                bankAccount: apiData.bank_account || bankAccount || '1234567890123456',
                bankOwner: apiData.bank_owner || bankOwner || 'Muhammad Faris',
                paymentDeadline: deadlineStr,
                generatedPassword: apiData.generated_password || null,
                generatedEmail: apiData.generated_email || null
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
