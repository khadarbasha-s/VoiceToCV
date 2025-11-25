import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import CVSuccess from "./pages/CVSuccess";

// TalentPath Pages
import TalentPathLayout from "./components/talentpath/TalentPathLayout";
import Dashboard from "./pages/talentpath/Dashboard";
import JobSearch from "./pages/talentpath/JobSearch";
import JobDetails from "./pages/talentpath/JobDetails";
import Applications from "./pages/talentpath/Applications";
import SavedJobs from "./pages/talentpath/SavedJobs";
import Profile from "./pages/talentpath/Profile";
import Notifications from "./pages/talentpath/Notifications";

// Recruiter Pages
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import PostJob from "./pages/recruiter/PostJob";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main VoiceToCV Routes */}
        <Route path="/" element={
          <div className="min-h-screen flex flex-col">
            <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">VoiceToCV</h1>
              <div className="space-x-4">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/talentpath/dashboard" className="bg-teal-500 px-4 py-2 rounded-lg hover:bg-teal-600">
                  TalentPath
                </Link>
              </div>
            </nav>
            <main className="flex-1">
              <Home />
            </main>
          </div>
        } />
        
        <Route path="/about" element={
          <div className="min-h-screen flex flex-col">
            <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">VoiceToCV</h1>
              <div className="space-x-4">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
              </div>
            </nav>
            <main className="flex-1">
              <About />
            </main>
          </div>
        } />

        {/* CV Success Page (After CV Generation) */}
        <Route path="/cv-success" element={<CVSuccess />} />

        {/* TalentPath Portal Routes */}
        <Route path="/talentpath/dashboard" element={
          <TalentPathLayout>
            <Dashboard />
          </TalentPathLayout>
        } />
        
        <Route path="/talentpath/jobs" element={
          <TalentPathLayout>
            <JobSearch />
          </TalentPathLayout>
        } />
        
        <Route path="/talentpath/jobs/:jobId" element={
          <TalentPathLayout>
            <JobDetails />
          </TalentPathLayout>
        } />
        
        <Route path="/talentpath/applications" element={
          <TalentPathLayout>
            <Applications />
          </TalentPathLayout>
        } />
        
        <Route path="/talentpath/saved" element={
          <TalentPathLayout>
            <SavedJobs />
          </TalentPathLayout>
        } />
        
        <Route path="/talentpath/profile" element={
          <TalentPathLayout>
            <Profile />
          </TalentPathLayout>
        } />
        
        <Route path="/talentpath/notifications" element={
          <TalentPathLayout>
            <Notifications />
          </TalentPathLayout>
        } />

        {/* Recruiter Routes */}
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/jobs/create" element={<PostJob />} />
      </Routes>
    </Router>
  );
}

export default App;
