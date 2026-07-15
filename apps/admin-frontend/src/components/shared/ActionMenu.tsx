import React from "react";
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  color?: string; // Adding color prop support
}

interface ActionMenuProps {
  items: ActionItem[];
  size?: "small" | "medium" | "large";
  buttonText?: string;
}

const sizeHeights: Record<NonNullable<ActionMenuProps["size"]>, number> = {
  small: 32,
  medium: 36,
  large: 40,
};

const ActionMenu: React.FC<ActionMenuProps> = ({ items, size = "small", buttonText = "Actions" }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <>
      <Button
        id="row-actions-button"
        aria-haspopup
        aria-controls={open ? "row-actions-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        variant="outlined"
        size={size}
        color="inherit"
        onClick={(e) => { e.stopPropagation(); handleOpen(e); }}
        sx={(theme) => ({
          textTransform: "none",
          borderRadius: 2,
          px: 1.25,
          minHeight: sizeHeights[size],
          lineHeight: `${sizeHeights[size]}px`,
          borderColor: theme.palette.grey[300],
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.background.paper,
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
          '&:hover': {
            borderColor: theme.palette.grey[400],
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.action.hover,
            boxShadow: '0 4px 12px rgba(16,24,40,0.08)',
          },
        })}
      >
        {buttonText}
        <KeyboardArrowDownIcon sx={{ ml: 0.5, fontSize: 18 }} />
      </Button>

      <Menu
        id="row-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 0.5,
              borderRadius: 2,
              minWidth: 160,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 8px 24px rgba(16, 24, 40, 0.08)'
            })
          }
        }}
      >
        {visible.map((item, idx) => (
          <MenuItem
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
              item.onClick();
            }}
            disabled={item.disabled}
            sx={{
              '& .MuiListItemIcon-root': { minWidth: 28 },
              '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
              ...(item.color ? { color: item.color } : {})
            }}
          >
            {item.icon && <ListItemIcon sx={{ minWidth: 28 }}>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionMenu;
