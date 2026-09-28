import { Routes, Route } from 'react-router-dom';
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
import Tmd from '../../mod/tmd/Placeholder';
import Sal from '../../mod/sal/Placeholder';
import Dea from '../../mod/dea/Placeholder';
import Cus from '../../mod/ctc';
import Wrk from '../../mod/wrk/Placeholder';
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
      <Route path="/med" element={<Med />} />
      <Route path="/tmd" element={<Tmd />} />
      <Route path="/sal" element={<Sal />} />
      <Route path="/dea" element={<Dea />} />
      <Route path="/tra" element={<Tra />} />
      <Route path="/cus" element={<Cus />} />
      <Route path="/wrk" element={<Wrk />} />
      <Route path="/rep" element={<Rep />} />
      <Route path="/alt" element={<Alt />} />
      <Route path="/cal" element={<Cal />} />
      <Route path="/doc" element={<Doc />} />
      <Route path="/arc" element={<Arc />} />
    </Routes>
  );
}
