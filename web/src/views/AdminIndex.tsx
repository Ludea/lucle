import { useContext } from "react";
import Button from "@mui/material/Button";

// Context
import { LucleRPC } from "context/Luclerpc";
import { useAuth } from "context/Auth";

function Index() {
  const client = useContext(LucleRPC);

  return (
    <div>
      <Button
        variant="contained"
        onClick={() => client.get_plugins({ name: "allo" })}
      >
        Test
      </Button>
    </div>
  );
}

export default Index;
