import { CircleAlert } from 'lucide-react'

export default function ErrorNote({ message }) {
  return message ? <div className="alert" role="alert"><CircleAlert size={18} />{message}</div> : null
}
