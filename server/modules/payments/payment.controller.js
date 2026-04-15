import * as paymentService from "./payment.service.js";

export async function getPaymentsByDeal(req, res) {
  try {
    const payments = await paymentService.getPaymentsByDeal(req.params.dealId);
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export async function payAdvance(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    const result = await paymentService.payAdvance({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      amount: Number(amount),
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function payFinal(req, res) {
  try {
    const { dealId, freelancerId, amount } = req.body;

    const result = await paymentService.payFinal({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      amount: Number(amount),
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function payTotal(req, res) {
  try {
    const { dealId, freelancerId, totalAmount, advanceAmount, deadline } = req.body;

    const result = await paymentService.payTotal({
      dealId: Number(dealId),
      clientId: req.user.id,
      freelancerId: freelancerId ? Number(freelancerId) : null,
      totalAmount: Number(totalAmount),
      advanceAmount: Number(advanceAmount),
      deadline,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function refundPayment(req, res) {
  try {
    const result = await paymentService.refundPayment({
      paymentId: Number(req.params.paymentId),
      clientId: req.user.id,
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
