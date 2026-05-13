const express = require('express');
const router = express.Router();
const checkout = require('../modules/checkout/checkout_controller');
const auth = require('../modules/auth/auth_controller');

router.get("/",async (req, res) => {
  checkout.index(req,res);
  // res.send("Hello World");
});

router.post("/process_payment", async (req, res) => {
  checkout.processPayment(req, res);
});

router.post("/process_bank", async (req, res) => {
  checkout.processBankPayment(req, res);
});

router.get("/thankyou", async (req, res) => {
  checkout.thankYou(req, res);
});

router.get("/atm_email", async (req, res) => {
  checkout.atmEmail(req, res);
});

router.get("/atm_banks", async (req, res) => {
  checkout.atmBanks(req, res);
});

router.get("/atm_va", async (req, res) => {
  checkout.atmVA(req, res);
});

// Auth routes
router.get("/login", (req, res) => {
  auth.login(req, res);
});

router.get("/register", (req, res) => {
  auth.register(req, res);
});

router.post("/process_login", (req, res) => {
  auth.processLogin(req, res);
});

router.post("/process_register", (req, res) => {
  auth.processRegister(req, res);
});

router.get("/logout", (req, res) => {
  auth.logout(req, res);
});

router.get("/account", (req, res) => {
  auth.account(req, res);
});

router.post("/process_change_password", (req, res) => {
  auth.changePassword(req, res);
});

module.exports = router;