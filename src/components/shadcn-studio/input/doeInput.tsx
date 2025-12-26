import { useId } from "react";
import { useAppDispatch } from "@/store";
import { setDoeName } from "@/store/reducers/selectedReducer";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DoeNameInput = () => {
  const id = useId();
  const dispatch = useAppDispatch();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDoeName(e.target.value));
  };

  return (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor={id}>DoE Name</Label>
      <Input type="text" placeholder="DoE Name" onChange={handleChange} />
    </div>
  );
};

export default DoeNameInput;
