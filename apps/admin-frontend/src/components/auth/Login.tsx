import React from "react";
import { Navigate } from "@tanstack/react-router";
// Removed @tanstack/react-form usage to avoid runtime issues
import { useAppDispatch, useAppSelector } from "../../store/store";
import { login } from "../../store/features/auth.slice";
import {
  Box,
  CssBaseline,
  Typography,
  TextField,
  Paper,
  Button,
  CircularProgress,
  FormLabel,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import theme from "../../theme";
import HeaderLogo from "../../assets/CouncilLogoWhite.png";
import Logo from "../../assets/CouncilLogo.png";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Subtle float animation for logo
const float = keyframes({
  "0%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-6px)" },
  "100%": { transform: "translateY(0)" },
});

// Soft glow animation for the main title text
const titleGlow = keyframes({
  "0%": { textShadow: "0 4px 14px rgba(0,0,0,0.45), 0 0 0px rgba(255,255,255,0.00)" },
  "50%": { textShadow: "0 6px 16px rgba(0,0,0,0.55), 0 0 28px rgba(255,255,255,0.55)" },
  "100%": { textShadow: "0 4px 14px rgba(0,0,0,0.45), 0 0 0px rgba(255,255,255,0.00)" },
});

// Stronger drop-shadow pulse to make the motion more noticeable
const titleDropPulse = keyframes({
  "0%": { filter: "drop-shadow(0 2px 2px rgba(0,0,0,.25))" },
  "50%": { filter: "drop-shadow(0 10px 26px rgba(0,0,0,.55))" },
  "100%": { filter: "drop-shadow(0 2px 2px rgba(0,0,0,.25))" },
});

// Aura pulse used behind the title for a visible glow ring (subtle blue, not bold)
const auraPulse = keyframes({
  "0%": { boxShadow: "0 0 0 0 rgba(17,120,215,0.00)" },
  "50%": { boxShadow: "0 0 70px 18px rgba(17,120,215,0.18)" },
  "100%": { boxShadow: "0 0 0 0 rgba(17,120,215,0.00)" },
});

// Gentle card float + shadow breathe
const cardFloat = keyframes({
  "0%": { transform: "translateY(0)", boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 20px 60px rgba(0,0,0,0.06)" },
  "50%": { transform: "translateY(-4px)", boxShadow: "0 20px 50px rgba(0,0,0,0.14), 0 30px 80px rgba(0,0,0,0.12)" },
  "100%": { transform: "translateY(0)", boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 20px 60px rgba(0,0,0,0.06)" },
});

// Clean, modern side-by-side login layout
function Login() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Optionally persist remember-me preference here
    dispatch(login({ email, password }));
  };

  if (status === "idle" && isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          // Ethiopian-themed abstract gradient background (restored)
          background: `
            radial-gradient(1200px 600px at -10% -10%, rgba(17, 120, 215, 0.06) 0%, rgba(17, 120, 215, 0) 60%),
            radial-gradient(1000px 500px at 110% 110%, rgba(34, 211, 238, 0.05) 0%, rgba(34, 211, 238, 0) 65%),
            linear-gradient(135deg, #0f3057 0%, #1178D7 48%, #21c4d3 100%)
          `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle woven pattern overlay (restored) */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 10px)",
            opacity: 0.1,
            pointerEvents: "none",
          }}
        />

        {/* Left: Organization branding */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 3, sm: 6, md: 8 },
            py: { xs: 6, md: 8 },
          }}
        >
          <Box sx={{ maxWidth: 720, textAlign: "center", mx: "auto" }}>
            {/* Logo + aura */}
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: { xs: 2, md: 3 },
                "&:hover img": { transform: "translateY(-2px) scale(1.02)" },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  width: { xs: 180, md: 240 },
                  height: { xs: 180, md: 240 },
                  borderRadius: "50%",
                  background:
                    "radial-gradient(closest-side, rgba(255,255,255,0.26), rgba(255,255,255,0.06) 60%, transparent 70%)",
                  filter: "blur(10px)",
                  opacity: 0.8,
                }}
              />
              <Box
                component="img"
                src={HeaderLogo}
                alt="Council logo"
                sx={{
                  position: "relative",
                  height: { xs: 120, md: 160 },
                  width: "auto",
                  filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.45))",
                  transition: "transform .2s ease",
                  animation: `${float} 8s ease-in-out infinite`,
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                }}
              />
            </Box>

            <Typography
              component="h1"
              sx={{
                position: "relative",
                fontFamily: "Inter, Montserrat, ui-sans-serif",
                fontWeight: 900,
                fontSize: { xs: "2rem", md: "2.6rem", lg: "3rem" },
                letterSpacing: 0.3,
                color: "#ffffff",
                textShadow: "0 6px 16px rgba(0,0,0,0.55)",
                lineHeight: 1.2,
                animation: `${titleGlow} 6s ease-in-out infinite, ${titleDropPulse} 7.5s ease-in-out infinite`,
                willChange: "filter, text-shadow, transform",
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                "&::after": {
                  content: "''",
                  position: "absolute",
                  inset: "-8px -24px",
                  borderRadius: 999,
                  pointerEvents: "none",
                  animation: `${auraPulse} 6.5s ease-in-out infinite`,
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                },
              }}
            >
              Ethiopian Council of Gospel Believers Church
            </Typography>
            <Typography
              component="p"
              sx={{
                mt: 1.5,
                color: alpha("#ffffff", 0.9),
                fontSize: { xs: "1rem", md: "1.1rem" },
                textShadow: "0 1px 3px rgba(0,0,0,0.35)",
              }}
            >
              Welcome back – Manage your account securely
            </Typography>
          </Box>
        </Box>

        {/* Right: Login form */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 3, sm: 6, md: 8 },
            py: { xs: 6, md: 8 },
          }}
        >
          <Paper
            elevation={10}
            sx={{
              width: "100%",
              maxWidth: { xs: 560, sm: 620, md: 680, lg: 720 },
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(255,255,255,0.5)",
              backdropFilter: "blur(12px) saturate(120%)",
              boxShadow: "0 12px 36px rgba(0,0,0,0.10), 0 22px 66px rgba(0,0,0,0.08)",
              transition: "transform .2s ease, box-shadow .2s ease",
              animation: `${cardFloat} 12s ease-in-out infinite`,
              willChange: "transform, box-shadow",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 18px 56px rgba(0,0,0,0.16)",
              },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Box component={"img"} src={Logo} alt="Council mark" sx={{ height: 40, width: "auto", mb: 1 }} />
              <Typography component="h2" variant="h5" fontWeight={theme.typography.fontWeightBold} color="#111827">
                Sign in to your account
              </Typography>
              <Typography component="p" variant="body2" color="#4B5563" mt={0.5}>
                Enter your credentials to continue
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <FormLabel htmlFor="email" sx={{ fontWeight: theme.typography.fontWeightBold, fontSize: "0.8rem", color: "#1F2937" }}>
                Email Address
              </FormLabel>
              <TextField
                size="medium"
                margin="normal"
                type="email"
                required
                fullWidth
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="youremail@mail.com"
                sx={{
                  my: 1,
                  "& .MuiOutlinedInput-root": {
                    transition: "box-shadow .2s ease, border-color .2s ease",
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(theme.palette.primary.main, 0.5) },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.primary.main },
                    "&.Mui-focused": { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}` },
                  },
                }}
                aria-placeholder="Enter email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormLabel htmlFor="password" sx={{ fontWeight: theme.typography.fontWeightBold, fontSize: "0.8rem", color: "#1F2937", my: 1 }}>
                Password
              </FormLabel>
              <TextField
                margin="normal"
                required
                fullWidth
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  my: 1,
                  "& .MuiOutlinedInput-root": {
                    transition: "box-shadow .2s ease, border-color .2s ease",
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(theme.palette.primary.main, 0.5) },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.primary.main },
                    "&.Mui-focused": { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}` },
                  },
                }}
                placeholder="********"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Options row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", mt: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" />}
                  label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={status === "loading"}
                sx={{
                  mt: 3,
                  mb: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.25,
                  borderRadius: 2,
                  boxShadow: "0 10px 28px rgba(59,130,246,0.45)",
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  "&:hover": {
                    filter: "brightness(1.05)",
                    transform: "translateY(-1px) scale(1.01)",
                    boxShadow: "0 14px 42px rgba(59,130,246,0.55)",
                  },
                }}
              >
                {status === "loading" ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Login"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}

export default Login;
