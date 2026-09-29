import { Navigate, Route, Routes } from 'react-router-dom';;
import Dashboard from '../../mod/dsh/Dashboard';
import Settings from '../../mod/set';
import Brd from '../../mod/brd';
import Hal from '../../mod/hal';
import Flk from '../../mod/flk';
import Inc from '../../mod/inc';
import Egg from '../../mod/egg';
import Dlg from '../../mod/dlg';
import Whs from '../../mod/whs';
import Fed from '../../mod/fed';
import Med from '../../mod/whs';
import Cus from '../../mod/ctc';
import Rep from '../../mod/rep';
import Alt from '../../mod/alt';
import Cal from '../../mod/cal';
import Doc from '../../mod/doc';
import Arc from '../../mod/arc';
import Tra from '../../mod/tra';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/set" element={<Settings />} />
      <Route path="/brd" element={<Brd />} />
      <Route path="/hal" element={<Hal />} />
      <Route path="/flk" element={<Flk />} />
      <Route path="/inc" element={<Inc />} />
      <Route path="/egg" element={<Egg />} />
      <Route path="/dlg" element={<Dlg />} />
      <Route path="/whs" element={<Whs />} />
      <Route path="/fed" element={<Fed />} />
      <Route path="/med" element={<Navigate to="/whs?tab=medicines" replace />} />
      <Route path="/tmd" element={<Navigate to="/whs/items" replace />} />
      <Route path="/sal" element={<Navigate to="/set?tab=about" replace />} />
      <Route path="/dea" element={<Navigate to="/tra?tab=deals" replace />} />
      <Route path="/tra" element={<Tra />} />
      <Route path="/ctc" element={<Cus />} />
      <Route path="/cus" element={<Navigate to="/ctc" replace />} />
      <Route path="/wrk" element={<Navigate to="/ctc?tab=worker" replace />} />
      <Route path="/rep" element={<Rep />} />
      <Route path="/alt" element={<Alt />} />
      <Route path="/cal" element={<Cal />} />
      <Route path="/doc" element={<Doc />} />
      <Route path="/arc" element={<Arc />} />
    </Routes>
  );
}
