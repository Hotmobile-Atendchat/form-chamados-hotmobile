// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import ThemeProviderContext from './contexts/ThemeProviderContext';
import MultilineTextFields from './components/form.component';
import NotificationProvider from './components/NotificationProvider';
import LogoHeader from './components/LogoHeader';
import KanbanBoardView from './components/KanbanBoard';
import DashboardView from './components/DashboardView';
import ProjectBoard from './components/ProjectBoard';
import LoginView from './components/LoginView'; 
import PrivateRoute from './components/PrivateRoute'; 
import ClientTracking from './components/ClientTracking'; 
import RegisterForm from './components/RegisterForm'; 

// Componente de Layout para o Admin
const AdminLayout = () => {
  return (
    <ThemeProviderContext>
      <Outlet />
    </ThemeProviderContext>
  );
};

export default function App() {
  return (
      <AuthProvider>
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start', // Mudei para flex-start para não centralizar verticalmente se tiver scroll
          alignItems: 'center',
          position: 'relative',
          
          // ✅ CORREÇÃO AQUI: Mudei de 'hidden' para 'auto'
          // 'auto' só mostra a barra de rolagem se o conteúdo for maior que a tela
          overflow: 'auto', 
          
          backgroundColor: 'inherit',
        }}
      >
        <NotificationProvider />

        {/* 🔺 Logo fixada no topo esquerdo */}
        <LogoHeader />

        {/* Roteamento */}
        <BrowserRouter>
          <Routes>
              {/* --- ROTAS PÚBLICAS (Sem Tema Dark) --- */}
              
              <Route path="/" element={<MultilineTextFields />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterForm />} /> 
              
              <Route 
                path="/acompanhamento/:id" 
                element={<div style={{ width: '100%', minHeight: '100%' }}><ClientTracking /></div>} 
              />

              {/* --- ROTAS PRIVADAS (COM TEMA DARK) --- */}
              <Route element={<AdminLayout />}>
                  
                  <Route 
                    path="/admin" 
                    element={
                      <PrivateRoute>
                        {/* height: 'auto' permite que o Kanban cresça se precisar */}
                        <div style={{ width: '100%', height: 'auto' }}><KanbanBoardView /></div>
                      </PrivateRoute>
                    } 
                  />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}><DashboardView /></div>
                      </PrivateRoute>
                    } 
                  />

                  <Route
                    path="/admin/projetos"
                    element={
                      <PrivateRoute>
                        <div style={{ width: '100%', height: 'auto' }}><ProjectBoard /></div>
                      </PrivateRoute>
                    }
                  />

              </Route>
          </Routes>
        </BrowserRouter>
        
      </div>
      </AuthProvider>
  );
}
