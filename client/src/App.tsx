import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ListingDetail from "./pages/ListingDetail";
import Dashboard from "./pages/Dashboard";
import ListItem from "./pages/ListItem";
import Messages from "./pages/Messages";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/explore" component={Explore} />
    <Route path="/listing/:id" component={ListingDetail} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/list-item" component={ListItem} />
    <Route path="/messages" component={Messages} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-center" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
