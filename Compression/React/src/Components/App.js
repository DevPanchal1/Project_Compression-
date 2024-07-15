import ParticlesComponent from "./particles"
import InputFileUpload from "./InputFileUpload" 
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
