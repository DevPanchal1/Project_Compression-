import ParticlesComponent from "./components/particles";
import InputFileUpload from "./components/InputFileUpload";
function App() {
  // Test Commit
  return (
    <>
      <div className="App">
        <ParticlesComponent id="particles" />
        <div className="center">
          <InputFileUpload />
        </div>
      </div>
    </>
  );
}

export default App;
