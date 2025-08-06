import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemText, 
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from "@mui/material";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Home, Task, AccountCircle } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();
  const { currentUser, userData, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
    handleProfileMenuClose();
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: 1201,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", minHeight: 64 }}>
          <Typography 
            variant="h5" 
            fontWeight={700}
            sx={{
              background: 'linear-gradient(45deg, #fff 30%, rgba(255,255,255,0.8) 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AllProperly
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2}>
            {userData && (
              <Typography variant="body2" color="inherit">
                Welcome, {userData.displayName || currentUser?.email}
              </Typography>
            )}
            <Button
              onClick={handleProfileMenuClick}
              sx={{ color: 'inherit', p: 1, borderRadius: 2 }}
            >
              {currentUser?.photoURL ? (
                <Avatar 
                  src={currentUser.photoURL} 
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle sx={{ fontSize: 32 }} />
              )}
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            mt: 8,
            border: 'none',
            background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        <List sx={{ pt: 2, px: 1 }}>
          <ListItemButton 
            component={Link} 
            to="/properties"
            sx={{
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '& .MuiSvgIcon-root': { color: 'white' },
              },
            }}
          >
            <Home sx={{ mr: 2, color: '#667eea' }} />
            <ListItemText primary="Properties" />
          </ListItemButton>
          
          <ListItemButton 
            component={Link} 
            to="/tasks"
            sx={{
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '& .MuiSvgIcon-root': { color: 'white' },
              },
            }}
          >
            <Task sx={{ mr: 2, color: '#667eea' }} />
            <ListItemText primary="Tasks" />
          </ListItemButton>
        </List>
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: "100vh",
          mt: 8,
          p: 0,
          width: `calc(100vw - ${drawerWidth}px)`,
          height: "calc(100vh - 64px)",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 3, flex: 1, height: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}