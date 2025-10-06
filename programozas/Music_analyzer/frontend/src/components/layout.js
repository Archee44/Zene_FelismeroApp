import { AppShell, Group, Button, Text, } from "@mantine/core";
import { Link, Outlet } from "react-router-dom";
import { IconHome, IconMusic } from "@tabler/icons-react";

export default function Layout() {
   return (
     <AppShell header={{ height: 80 }} padding="40" style={{ background: '#f9f9f9' }}>
       <AppShell.Header style={{ boxShadow: '0px 5px 10px 0px rgba(82, 63, 105, 0.05)', border: '1px solid #f1f1f1' }}>
         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
           <Text fw={700} size="xl"> 🎧 Zene Alkalmazás </Text> 
           <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <Group> 
                <Button component={Link} to="/" variant="filled" color="indigo" size="md" leftSection={<IconHome size={14} />}> Főoldal </Button>
                <Button component={Link} to="/music-analyzer" variant="filled" color="indigo" size="md" leftSection={<IconMusic size={14} />}> Elemzés </Button> 
              </Group> 
            </div>
          </div> 
        </AppShell.Header>
        <main style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
           <Outlet /> 
        </main> 
      </AppShell>
       ); 
    }