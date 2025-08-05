import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, Button } from "@mui/material";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

const drawerWidth = 220;

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={700}>AllProperly</Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          <ListItemButton component={Link} to="/properties">
            <ListItemText primary="Properties" />
          </ListItemButton>
          <ListItemButton component={Link} to="/properties/new">
            <ListItemText primary="Add Property" />
          </ListItemButton>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f7fa",
          minHeight: "100vh",
          mt: 8,
          px: 4,
          py: 4,
          width: `calc(100vw - ${drawerWidth}px)`,
          height: "100vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}