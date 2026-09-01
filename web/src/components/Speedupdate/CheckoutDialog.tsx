import { useState, useContext, useEffect, Fragment } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExtensionIcon from "@mui/icons-material/Extension";
import CreditCardIcon from "@mui/icons-material/CreditCard";

import { LucleRPC } from "context/Luclerpc";
import { createAndConfirmPayment } from "utils/rpc";
import { create } from "@bufbuild/protobuf";
import { CreateAndConfirmPaymentRequestSchema } from "gen/lucle_pb";

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceModel =
  | { type: "free" }
  | { type: "paid"; amount: number; currency: string }
  | { type: "subscription"; monthly: number; yearly: number; currency: string };

export interface CheckoutPlugin {
  id:          string;
  name:        string;
  description: string;
  author:      string;
  version:     string;
  icon:        string;
  price:       PriceModel;
}

export interface Props {
  open:      boolean;
  plugin:    CheckoutPlugin | null;
  onClose:   () => void;
  onSuccess: (pluginId: string) => void;
}

type BillingCycle = "monthly" | "yearly";
type Step = "plan" | "payment" | "success";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrice(price: PriceModel, cycle: BillingCycle): number {
  if (price.type === "paid") return price.amount;
  if (price.type === "subscription")
    return cycle === "yearly" ? price.yearly : price.monthly;
  return 0;
}

function getSavings(price: PriceModel): number | null {
  if (price.type !== "subscription") return null;
  const annualIfMonthly = price.monthly * 12;
  return Math.round(((annualIfMonthly - price.yearly) / annualIfMonthly) * 100);
}

function toCents(dollars: number) {
  return Math.round(dollars * 100);
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

const STEPS: Step[] = ["plan", "payment", "success"];

function Stepper({ step }: { step: Step }) {
  const current = STEPS.indexOf(step);
  return (
    <Box sx={{ px: 3, pt: 1.5 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <Box sx={{
              width: 24, height: 24, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 700,
              bgcolor: current === i ? "primary.main" : current > i ? "success.main" : "action.disabledBackground",
              color: current >= i ? "#fff" : "text.disabled",
              transition: "background-color 0.3s",
            }}>
              {current > i ? "✓" : i + 1}
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={(theme) => ({
                flex: 1, height: 2, borderRadius: 1,
                bgcolor: current > i ? "success.main" : theme.palette.action.disabledBackground,
                transition: "background-color 0.3s",
              })} />
            )}
          </Fragment>
        ))}
      </Stack>
      <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.5, px: 0.25 }}>
        {["Plan", "Payment", "Done"].map((label) => (
          <Typography key={label} variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
            {label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────

function OrderSummary({
  plugin,
  cycle,
  promoApplied,
}: {
  plugin:       CheckoutPlugin;
  cycle:        BillingCycle;
  promoApplied: boolean;
}) {
  const basePrice = getPrice(plugin.price, cycle);
  const discount  = promoApplied ? Math.round(basePrice * 0.1) : 0;
  const total     = basePrice - discount;
  const isSub     = plugin.price.type === "subscription";

  return (
    <Box sx={(theme) => ({
      bgcolor: theme.palette.action.hover,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      p: 2,
    })}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Avatar sx={(theme) => ({
          width: 36, height: 36, fontSize: "1.1rem",
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        })}>
          {plugin.icon}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>{plugin.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            v{plugin.version} · by {plugin.author}
          </Typography>
        </Box>
        <Chip
          label={isSub ? (cycle === "yearly" ? "Annual" : "Monthly") : "One-time"}
          size="small" variant="outlined"
          sx={{ fontSize: "0.65rem", height: 20 }}
        />
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      <Stack spacing={0.75}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            {isSub ? (cycle === "yearly" ? "Annual subscription" : "Monthly subscription") : "License (one-time)"}
          </Typography>
          <Typography variant="body2">${basePrice}</Typography>
        </Stack>
        {promoApplied && (
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="body2" color="success.main">Promo LUCLE10 (−10%)</Typography>
            <Typography variant="body2" color="success.main">−${discount}</Typography>
          </Stack>
        )}
        <Divider />
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} color="primary.main">
            ${total}
            {isSub && (
              <Typography component="span" variant="caption" color="text.secondary">
                /{cycle === "yearly" ? "yr" : "mo"}
              </Typography>
            )}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── StepPlan ─────────────────────────────────────────────────────────────────

function StepPlan({
  plugin,
  cycle,
  onCycleChange,
  onNext,
}: {
  plugin:        CheckoutPlugin;
  cycle:         BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
  onNext:        () => void;
}) {
  const isSub   = plugin.price.type === "subscription";
  const savings = getSavings(plugin.price);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Choose your plan</Typography>
        <Typography variant="body2" color="text.secondary">{plugin.description}</Typography>
      </Box>

      {isSub && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Billing cycle
          </Typography>
          <ToggleButtonGroup value={cycle} exclusive fullWidth size="small"
            onChange={(_, v) => v && onCycleChange(v)}>
            <ToggleButton value="monthly" sx={{
              textTransform: "none", flexDirection: "column", py: 1.5,
              "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText" },
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Monthly</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                ${(plugin.price as { monthly: number }).monthly}/mo
              </Typography>
            </ToggleButton>
            <ToggleButton value="yearly" sx={{
              textTransform: "none", flexDirection: "column", py: 1.5, position: "relative",
              "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText" },
            }}>
              {savings && (
                <Chip label={`Save ${savings}%`} size="small" color="success"
                  sx={{ position: "absolute", top: -10, right: 8, height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Yearly</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                ${(plugin.price as { yearly: number }).yearly}/yr
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <OrderSummary plugin={plugin} cycle={cycle} promoApplied={false} />

      <Button variant="contained" size="large" fullWidth onClick={onNext}>
        Continue to payment
      </Button>

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center" }} spacing={0.5}>
        <LockOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
        <Typography variant="caption" color="text.disabled">
          Secured by Stripe · Cancel anytime
        </Typography>
      </Stack>
    </Stack>
  );
}

// ─── Card form helpers ────────────────────────────────────────────────────────

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// ─── StepPayment ──────────────────────────────────────────────────────────────

function StepPayment({
  plugin,
  cycle,
  onBack,
  onSuccess,
}: {
  plugin:    CheckoutPlugin;
  cycle:     BillingCycle;
  onBack:    () => void;
  onSuccess: () => void;
}) {
  const client = useContext(LucleRPC);

  const [paying, setPaying]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [promoInput, setPromoInput]   = useState("");
  const [promoState, setPromoState]   = useState<"idle" | "applied" | "invalid">("idle");

  const [cardNumber, setCardNumber]   = useState("");
  const [expiry, setExpiry]           = useState("");
  const [cvc, setCvc]                 = useState("");
  const [cardName, setCardName]       = useState("");
  const [email, setEmail]             = useState("");

  const promoApplied = promoState === "applied";
  const basePrice    = getPrice(plugin.price, cycle);
  const discount     = promoApplied ? Math.round(basePrice * 0.1) : 0;
  const total        = basePrice - discount;

  function applyPromo() {
    if (promoInput.trim().toUpperCase() === "LUCLE10") {
      setPromoState("applied");
    } else {
      setPromoState("invalid");
    }
  }

  function validate(): string | null {
    if (!cardName.trim())                              return "Cardholder name is required";
    if (!email.trim() || !email.includes("@"))        return "Valid email is required";
    if (cardNumber.replace(/\s/g, "").length < 16)    return "Invalid card number";
    if (expiry.length < 5)                            return "Invalid expiry date";
    if (cvc.length < 3)                               return "Invalid CVC";
    return null;
  }

  function handlePay() {
    const err = validate();
    if (err) { setError(err); return; }

    setError(null);
    setPaying(true);

    const [expMonth, expYear] = expiry.split("/").map(Number);

    createAndConfirmPayment(
      client,
      create(CreateAndConfirmPaymentRequestSchema, {
        pluginId:     plugin.id,
        amount:       BigInt(toCents(total)),
        currency:     "usd",
        billingCycle: cycle,
        promoCode:    promoApplied ? "LUCLE10" : "",
        card: {
          number:   cardNumber.replace(/\s/g, ""),
          expMonth,
          expYear:  2000 + expYear,
          cvc,
        },
        customer: {
          name:  cardName.trim(),
          email: email.trim(),
        },
      }),
    )
      .then(() => onSuccess())
      .catch((e: Error) => setError(e.message))
      .finally(() => setPaying(false));
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
        <IconButton size="small" onClick={onBack} disabled={paying}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Payment details</Typography>
      </Stack>

      <OrderSummary plugin={plugin} cycle={cycle} promoApplied={promoApplied} />

      {/* Card form */}
      <Box sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
      })}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 2 }} spacing={1}>
          <CreditCardIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Card information</Typography>
        </Stack>
        <Stack spacing={1.5}>
          <TextField label="Cardholder name" size="small" fullWidth
            value={cardName} onChange={(e) => setCardName(e.target.value)}
            disabled={paying} placeholder="Jane Doe" />
          <TextField label="Email" size="small" fullWidth
            value={email} onChange={(e) => setEmail(e.target.value)}
            disabled={paying} placeholder="jane@example.com"
            slotProps={{ htmlInput: { type: "email" } }} />
          <TextField label="Card number" size="small" fullWidth
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            disabled={paying} placeholder="1234 5678 9012 3456"
            slotProps={{ htmlInput: { inputMode: "numeric" } }} />
          <Stack direction="row" spacing={1.5}>
            <TextField label="Expiry" size="small" fullWidth
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              disabled={paying} placeholder="MM/YY"
              slotProps={{ htmlInput: { inputMode: "numeric" } }} />
            <TextField label="CVC" size="small" fullWidth
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              disabled={paying} placeholder="•••"
              slotProps={{ htmlInput: { inputMode: "numeric" } }} />
          </Stack>
        </Stack>
      </Box>

      {/* Promo code */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <TextField label="Promo code" size="small" fullWidth
          value={promoInput}
          onChange={(e) => {
            setPromoInput(e.target.value.toUpperCase());
            if (promoState === "invalid") setPromoState("idle");
          }}
          error={promoState === "invalid"}
          helperText={
            promoState === "invalid"
              ? "Invalid promo code"
              : promoApplied
              ? "✓ LUCLE10 applied — 10% off"
              : ""
          }
          disabled={promoApplied || paying}
          placeholder="LUCLE10"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LocalOfferIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            formHelperText: { sx: { color: promoApplied ? "success.main" : undefined } },
          }}
        />
        <Button variant="outlined" size="small" onClick={applyPromo}
          disabled={promoApplied || paying || !promoInput}
          sx={{ mt: 0.5, flexShrink: 0, height: 40 }}>
          Apply
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {paying && <LinearProgress />}

      <Button variant="contained" size="large" fullWidth
        onClick={handlePay} disabled={paying}
        startIcon={<CreditCardIcon />}>
        {paying ? "Processing…" : `Pay $${total}`}
      </Button>

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center" }} spacing={0.5}>
        <LockOutlinedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
        <Typography variant="caption" color="text.disabled">
          256-bit TLS · Powered by Stripe
        </Typography>
      </Stack>
    </Stack>
  );
}

// ─── StepSuccess ──────────────────────────────────────────────────────────────

function StepSuccess({ plugin, onClose }: { plugin: CheckoutPlugin; onClose: () => void }) {
  return (
    <Fade in>
      <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center", py: 2 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar sx={(theme) => ({
            width: 64, height: 64, fontSize: "2rem",
            bgcolor: theme.palette.action.hover,
            border: `2px solid ${theme.palette.success.main}`,
          })}>
            {plugin.icon}
          </Avatar>
          <CheckCircleIcon sx={(theme) => ({
            position: "absolute", bottom: -4, right: -4, fontSize: 24,
            color: "success.main",
            bgcolor: theme.palette.background.paper,
            borderRadius: "50%",
          })} />
        </Box>

        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Purchase complete!</Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>{plugin.name}</strong> is now unlocked. You can install it right away.
          </Typography>
        </Box>

        <Box sx={(theme) => ({
          bgcolor: theme.palette.success.main + "12",
          border: `1px solid ${theme.palette.success.main}44`,
          borderRadius: 2, px: 3, py: 1.5, width: "100%",
        })}>
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
            A receipt has been sent to your email address.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: "100%"}}>
          <Button variant="outlined" fullWidth startIcon={<ExtensionIcon />} onClick={onClose}>
            Back to store
          </Button>
          <Button variant="contained" fullWidth color="success" onClick={onClose}>
            Install now
          </Button>
        </Stack>
      </Stack>
    </Fade>
  );
}

// ─── CheckoutDialog ───────────────────────────────────────────────────────────

export default function CheckoutDialog({ open, plugin, onClose, onSuccess }: Props) {
  const [step, setStep]   = useState<Step>("plan");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    if (open) { setStep("plan"); setCycle("monthly"); }
  }, [open, plugin?.id]);

  if (!plugin) return null;

  function handleClose() {
    if (step === "success") onSuccess(plugin!.id);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={step === "success" ? handleClose : undefined}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <Box sx={(theme) => ({
        px: 3, pt: 2.5, pb: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}>
        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
          <LockOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">Secure checkout</Typography>
        </Stack>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Stepper step={step} />

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        {step === "plan" && (
          <StepPlan plugin={plugin} cycle={cycle} onCycleChange={setCycle}
            onNext={() => setStep("payment")} />
        )}
        {step === "payment" && (
          <StepPayment plugin={plugin} cycle={cycle}
            onBack={() => setStep("plan")} onSuccess={() => setStep("success")} />
        )}
        {step === "success" && (
          <StepSuccess plugin={plugin} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
