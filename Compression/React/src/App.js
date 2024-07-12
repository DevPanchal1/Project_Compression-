import ParticlesComponent from "./Components/particles";
import InputFileUpload from "./Components/InputFileUpload";
function App() {
 
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
