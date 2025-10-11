import { AppShell, Group, Button, Text } from "@mantine/core";
import { Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import { IconHome, IconMusic, IconSearch } from "@tabler/icons-react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (to) => {
  if (location.pathname === to) {
    navigate(0);
  }
  }

   return (
     <AppShell header={{ height: 80 }} padding="40" style={{background: "linear-gradient(180deg, #f0f3f8 0%, #ffffff 100%)", minHeight: "100vh"}}>
       <AppShell.Header style={{ boxShadow: '0px 5px 10px 0px rgba(82, 63, 105, 0.05)', border: '1px solid #f1f1f1' }}>
         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
           <img src="/icons/Melodive.png" alt="Logo" style={{ height: 50 }}/>
           <Text style={{ fontSize: 30, fontWeight: "bold", color: "#0C1A2A" }}>MeloDive</Text>
           <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <Group> 
                <Button component={Link} to="/" variant="filled" color="#0C1A2A" size="md" leftSection={<IconHome size={14} />} style={{ transition: "transform 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")} onClick={() => handleClick("/")}> Főoldal </Button>
                <Button component={Link} to="/music-analyzer" variant="filled" color="#0C1A2A" size="md" leftSection={<IconMusic size={14} />} style={{ transition: "transform 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")} onClick={() => handleClick("/music-analyzer")}> Elemzés </Button> 
                <Button component={Link} to="/lyrics-search" variant="filled" color="#0C1A2A" size="md" leftSection={<IconSearch size={14} />} style={{ transition: "transform 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")} onClick={() => handleClick("/lyrics-search")}> Zene Keresés </Button>
              </Group> 
            </div>
          </div> 
        </AppShell.Header>
        <main style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 80px)", paddingTop: 70 }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "20%",
            height: "100%",
            background: "#a9aaacff",

          }} />
          <div style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "20%",
            height: "100%",
            background: "#a9aaacff",
          }} />
           <Outlet /> 
        </main> 
      </AppShell>
       ); 
    }