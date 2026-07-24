import { AppRouter } from "./router/AppRouter";
import { Toaster } from "./components/Toast";

function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
