import { useState, useEffect, useCallback, Fragment } from "react";
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
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExtensionIcon from "@mui/icons-material/Extension";

// Stripe
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder"
);

type PriceModel =
  | { type: "free" }
  | { type: "paid"; amount: number; currency: string }
  | { type: "subscription"; monthly: number; yearly: number; currency: string };

export interface CheckoutPlugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon: string;
  price: PriceModel;
}

export interface Props {
  open: boolean;
  plugin: CheckoutPlugin | null;
  onClose: () => void;
  onSuccess: (pluginId: string) => void;
}

type BillingCycle = "monthly" | "yearly";
type Step = "plan" | "payment" | "success";

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

const STEPS: Step[] = ["plan", "payment", "success"];

function Stepper({ step }: { step: Step }) {
  const current = STEPS.indexOf(step);
  return (
    <Box sx={{ px: 3, pt: 1.5 }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor:
                  current === i
                    ? "primary.main"
                    : current > i
                    ? "success.main"
                    : "action.disabledBackground",
                color: current >= i ? "#fff" : "text.disabled",
                transition: "background-color 0.3s",
              }}
            >
              {current > i ? "✓" : i + 1}
            </Box>
            {i < STEPS.length - 1 && (
              <Box
                sx={(theme) => ({
                  flex: 1,
                  height: 2,
                  borderRadius: 1,
                  bgcolor:
                    current > i
                      ? "success.main"
                      : theme.palette.action.disabledBackground,
                  transition: "background-color 0.3s",
                })}
              />
            )}
          </Fragment>
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between" mt={0.5} px={0.25}>
        {["Plan", "Payment", "Done"].map((label) => (
          <Typography
            key={label}
            variant="caption"
            color="text.disabled"
            sx={{ fontSize: "0.6rem" }}
          >
            {label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function OrderSummary({
  plugin,
  cycle,
  promoApplied,
}: {
  plugin: CheckoutPlugin;
  cycle: BillingCycle;
  promoApplied: boolean;
}) {
  const basePrice = getPrice(plugin.price, cycle);
  const discount = promoApplied ? Math.round(basePrice * 0.1) : 0;
  const total = basePrice - discount;
  const isSub = plugin.price.type === "subscription";

  return (
    <Box
      sx={(theme) => ({
        bgcolor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
      })}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Avatar
          sx={(theme) => ({
            width: 36,
            height: 36,
            fontSize: "1.1rem",
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          {plugin.icon}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {plugin.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            v{plugin.version} · by {plugin.author}
          </Typography>
        </Box>
        <Chip
          label={isSub ? (cycle === "yearly" ? "Annual" : "Monthly") : "One-time"}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 20 }}
        />
      </Stack>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {isSub
              ? cycle === "yearly"
                ? "Annual subscription"
                : "Monthly subscription"
              : "License (one-time)"}
          </Typography>
          <Typography variant="body2">${basePrice}</Typography>
        </Stack>
        {promoApplied && (
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="success.main">
              Promo LUCLE10 (−10%)
            </Typography>
            <Typography variant="body2" color="success.main">
              −${discount}
            </Typography>
          </Stack>
        )}
        <Divider />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="subtitle2" fontWeight={700}>
            Total
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
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

function StepPlan({
  plugin,
  cycle,
  onCycleChange,
  onNext,
}: {
  plugin: CheckoutPlugin;
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
  onNext: () => void;
}) {
  const isSub = plugin.price.type === "subscription";
  const savings = getSavings(plugin.price);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Choose your plan
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {plugin.description}
        </Typography>
      </Box>

      {isSub && (
        <Box>
          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            Billing cycle
          </Typography>
          <ToggleButtonGroup
            value={cycle}
            exclusive
            onChange={(_, v) => v && onCycleChange(v)}
            fullWidth
            size="small"
          >
            <ToggleButton
              value="monthly"
              sx={{
                textTransform: "none",
                flexDirection: "column",
                py: 1.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>Monthly</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                ${(plugin.price as { monthly: number }).monthly}/mo
              </Typography>
            </ToggleButton>

            <ToggleButton
              value="yearly"
              sx={{
                textTransform: "none",
                flexDirection: "column",
                py: 1.5,
                position: "relative",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                },
              }}
            >
              {savings && (
                <Chip
                  label={`Save ${savings}%`}
                  size="small"
                  color="success"
                  sx={{
                    position: "absolute",
                    top: -10,
                    right: 8,
                    height: 18,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                  }}
                />
              )}
              <Typography variant="subtitle2" fontWeight={600}>Yearly</Typography>
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
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
        <LockOutlinedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
        <Typography variant="caption" color="text.disabled">
          Secured by Stripe · Cancel anytime
        </Typography>
      </Stack>
    </Stack>
  );
}

interface StripeFormProps {
  plugin: CheckoutPlugin;
  cycle: BillingCycle;
  clientSecret: string;
  onBack: () => void;
  onSuccess: () => void;
}

function StripePaymentForm({
  plugin,
  cycle,
  clientSecret,
  onBack,
  onSuccess,
}: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoState, setPromoState] = useState<"idle" | "applied" | "invalid">("idle");

  const promoApplied = promoState === "applied";
  const basePrice = getPrice(plugin.price, cycle);
  const discount = promoApplied ? Math.round(basePrice * 0.1) : 0;
  const total = basePrice - discount;

  function applyPromo() {
    if (promoInput.trim().toUpperCase() === "LUCLE10") {
      setPromoState("applied");
    } else {
      setPromoState("invalid");
    }
  }

  async function handlePay() {
    if (!stripe || !elements) return;
    setStripeError(null);
    setPaying(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setStripeError(submitError.message ?? "Validation error");
      setPaying(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setStripeError(error.message ?? "Payment failed");
      setPaying(false);
    } else {
      onSuccess();
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton size="small" onClick={onBack} disabled={paying}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" fontWeight={700}>Payment details</Typography>
      </Stack>
      <OrderSummary plugin={plugin} cycle={cycle} promoApplied={promoApplied} />
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          p: 2,
        })}
      >
        {!ready && (
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={40} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
            </Stack>
          </Stack>
        )}
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs" }}
        />
      </Box>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          label="Promo code"
          size="small"
          fullWidth
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
            formHelperText: {
              sx: { color: promoApplied ? "success.main" : undefined },
            },
          }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={applyPromo}
          disabled={promoApplied || paying || !promoInput}
          sx={{ mt: 0.5, flexShrink: 0, height: 40 }}
        >
          Apply
        </Button>
      </Stack>

      {stripeError && (
        <Alert severity="error" onClose={() => setStripeError(null)}>
          {stripeError}
        </Alert>
      )}
      {paying && <LinearProgress />}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handlePay}
        disabled={paying || !stripe || !elements || !ready}
        startIcon={<LockOutlinedIcon />}
      >
        {paying ? "Processing…" : `Pay $${total}`}
      </Button>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
        <LockOutlinedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
        <Typography variant="caption" color="text.disabled">
          256-bit TLS · Powered by Stripe
        </Typography>
      </Stack>
    </Stack>
  );
}

function StepPayment({
  plugin,
  cycle,
  onBack,
  onSuccess,
}: {
  plugin: CheckoutPlugin;
  cycle: BillingCycle;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const amount = getPrice(plugin.price, cycle);

  const createIntent = useCallback(async () => {
    setFetchError(null);
    setClientSecret(null);
    try {
      const res = await fetch("/api/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plugin_id: plugin.id,
          amount: toCents(amount),   // en centimes
          currency: "usd",
          billing_cycle: cycle,      // "monthly" | "yearly"
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: { client_secret: string } = await res.json();
      setClientSecret(data.client_secret);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Unable to reach payment server");
    }
  }, [plugin.id, amount, cycle]);

  useEffect(() => { createIntent(); }, [createIntent]);

  const appearance: StripeElementsOptions["appearance"] = {
    theme: "night",
    variables: {
      colorPrimary: "#7c4dff",
      colorBackground: "#1a1a2e",
      colorText: "#e0e0e0",
      colorDanger: "#f44336",
      fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
      borderRadius: "8px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "none",
        backgroundColor: "rgba(255,255,255,0.05)",
      },
      ".Input:focus": {
        border: "1px solid #7c4dff",
        boxShadow: "0 0 0 1px #7c4dff",
      },
      ".Label": { color: "rgba(255,255,255,0.7)", fontSize: "12px" },
    },
  };

  if (fetchError) {
    return (
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={onBack}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>Payment details</Typography>
        </Stack>
        <Alert
          severity="error"
          action={<Button size="small" onClick={createIntent}>Retry</Button>}
        >
          {fetchError}
        </Alert>
      </Stack>
    );
  }

  if (!clientSecret) {
    return (
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={onBack}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>Payment details</Typography>
        </Stack>
        <Skeleton variant="rounded" height={80} />
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
          })}
        >
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={40} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
            </Stack>
          </Stack>
        </Box>
        <Skeleton variant="rounded" height={48} />
      </Stack>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance }}
      key={clientSecret}
    >
      <StripePaymentForm
        plugin={plugin}
        cycle={cycle}
        clientSecret={clientSecret}
        onBack={onBack}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

function StepSuccess({ plugin, onClose }: { plugin: CheckoutPlugin; onClose: () => void }) {
  return (
    <Fade in>
      <Stack spacing={3} alignItems="center" textAlign="center" py={2}>
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={(theme) => ({
              width: 64,
              height: 64,
              fontSize: "2rem",
              bgcolor: theme.palette.action.hover,
              border: `2px solid ${theme.palette.success.main}`,
            })}
          >
            {plugin.icon}
          </Avatar>
          <CheckCircleIcon
            sx={(theme) => ({
              position: "absolute",
              bottom: -4,
              right: -4,
              fontSize: 24,
              color: "success.main",
              bgcolor: theme.palette.background.paper,
              borderRadius: "50%",
            })}
          />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Purchase complete!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>{plugin.name}</strong> is now unlocked. You can install it right away.
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            bgcolor: theme.palette.success.main + "12",
            border: `1px solid ${theme.palette.success.main}44`,
            borderRadius: 2,
            px: 3,
            py: 1.5,
            width: "100%",
          })}
        >
          <Typography variant="caption" color="success.main" fontWeight={600}>
            A receipt has been sent to your email address.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} width="100%">
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

export default function CheckoutDialog({ open, plugin, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("plan");
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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <Box
        sx={(theme) => ({
          px: 3,
          pt: 2.5,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <LockOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">
            Secure checkout
          </Typography>
        </Stack>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Stepper step={step} />
      <DialogContent sx={{ pt: 2, pb: 3 }}>
        {step === "plan" && (
          <StepPlan
            plugin={plugin}
            cycle={cycle}
            onCycleChange={setCycle}
            onNext={() => setStep("payment")}
          />
        )}
        {step === "payment" && (
          <StepPayment
            plugin={plugin}
            cycle={cycle}
            onBack={() => setStep("plan")}
            onSuccess={() => setStep("success")}
          />
        )}
        {step === "success" && (
          <StepSuccess plugin={plugin} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
