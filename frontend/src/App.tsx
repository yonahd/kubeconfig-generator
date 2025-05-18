import { useState } from 'react';
import { Tabs, Tab, Container, Box, Typography, Paper } from '@mui/material';
import RoleGenerator from './components/RoleGenerator';
import { KubeconfigGenerator } from './components/KubeconfigGenerator';
import './index.css'; // Import global styles

function App() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Kubernetes Access Manager
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{ mb: 3 }}
        >
          <Tab label="Role Generator" />
          <Tab label="Kubeconfig Generator" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {activeTab === 0 && <RoleGenerator />}
          {activeTab === 1 && <KubeconfigGenerator />}
        </Box>
      </Paper>
    </Container>
  );
}

export default App;