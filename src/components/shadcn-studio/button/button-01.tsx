import { Button } from '@/components/ui/button'
import { useAppDispatch, addColumn } from '@/store'

const ButtonDemo = () => {
  const dispatch = useAppDispatch()

  return <Button onClick={() => dispatch(addColumn())}>Add</Button>
}

export default ButtonDemo
