// src/components/Home/Home.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { Navigate,Link } from 'react-router-dom';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  query,
  where,
  documentId
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from './home.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowDown, faU } from '@fortawesome/free-solid-svg-icons'
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { faShuffle } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  const {
    userLoggedIn,
    currentUser,
    isAdmin,
    isManager,
    isStaff,
    isTenant,
    userProfile,
    loading: authLoading
  } = useAuth();

  const [addTenant, setAddTenant] = useState(false);
  const[editTenant, setEditTenant] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTenantId, setCurrentTenantId] = useState(null);

  const [firstname, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantAmount, setTenantAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tenancyEndDate, setTenancyEndDate] = useState('');
  const [tenancyStartDate, setTenancyStartDate] = useState('');
  const[username, setUsername] = useState('');

  const [tag, setTag] = useState('tenant');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      if (authLoading || (!isAdmin && !isManager && !isStaff)) return;

      try {
        const querySnapshot = await getDocs(collection(db, 'bookings'));
        const tenantsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTenants(tenantsData);
        setUsername(currentUser.displayName);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setFeedback('Failed to load tenant data.');
      }
    };

    fetchTenants();
  }, [authLoading, isAdmin, isManager, isStaff]);

  const capitaliseWords = str =>
    str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

  const formatUKDate = timestamp => {
    if (!timestamp || !timestamp.toDate) return '';
    return timestamp.toDate().toLocaleDateString('en-GB');
  };

  const numberCheck = number => /^\d*\.?\d+$/.test(String(number));

  const handleSubmit = async e => {
    e.preventDefault();
    setFeedback('');
    setErrorMessage('');

    const trimmedFirstName = firstname.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedTenantAmount = tenantAmount.trim();
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedTenantAmount || !trimmedPhoneNumber) {
      setErrorMessage('All fields are required and cannot be just spaces.');
      return;
    }

    if (!isAdmin && !isManager && !isStaff) {
      setFeedback('You do not have permission to add/edit tenants.');
      return;
    }

    if(tenancyStartDate && tenancyEndDate){
      const startDate = new Date(tenancyStartDate);
      const endDate = new Date(tenancyEndDate);

      startDate.setHours(0,0,0,0);
      endDate.setHours(0,0,0,0);
      if(endDate < startDate){
        setErrorMessage("Tenancy End Date cannot be before Tenancy Start Date");
        return;
      }
    }

    try {
      if (isEditing) {
        const tenantRef = doc(db, 'bookings', currentTenantId);
        const q = query(
          collection(db, 'bookings'),
          where('email', '==', trimmedEmail),
          where(documentId(), '!=', currentTenantId)
        );
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty){
          alert("Another tenant with this email already exists");
          return;
        }
        await updateDoc(tenantRef, {
          firstname: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          tenantAmount: trimmedTenantAmount,
          phoneNumber: trimmedPhoneNumber,
          tenancyStartDate:  tenancyEndDate ? Timestamp.fromDate(new Date(tenancyEndDate)) : null,
          tenancyEndDate: tenancyEndDate ? Timestamp.fromDate(new Date(tenancyEndDate)) : null,
          tag,
          lastUpdated: new Date(),
          userId: currentUser.uid,
          username: username || '',
        });
        alert('Tenant updated successfully!');
      } else {

        const q = query(collection(db, 'bookings'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty){
          alert('Another tenant with this email already exists.');
          return;
        }

        await addDoc(collection(db, 'bookings'), {
          firstname: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          tenantAmount: trimmedTenantAmount,
          phoneNumber: trimmedPhoneNumber,
          tenancyStartDate:  tenancyStartDate ? Timestamp.fromDate(new Date(tenancyStartDate)) : null,
          tenancyEndDate: tenancyEndDate ? Timestamp.fromDate(new Date(tenancyEndDate)) : null,
          tag,
          dayBooked: Timestamp.now(),
          createdAt: serverTimestamp(),
          userId: currentUser.uid,
          username: username || '',
        });
        alert('Tenant added successfully!');
      }

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setTenantAmount('');
      setPhoneNumber('');
      setTenancyEndDate('');
      setTenancyStartDate('');
      setTag('tenant');
      setIsEditing(false);
      setCurrentTenantId(null);
      setAddTenant(false);

      // Refresh list
      const querySnapshot = await getDocs(collection(db, 'bookings'));
      const tenantsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error adding/updating tenant:', error);
      setFeedback(`Failed to save tenant: ${error.message}`);
    }
  };

  const handleDelete = async id => {
    if (!isAdmin && !isManager) {
      setFeedback('You do not have permission to delete tenants.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'bookings', id));
      setTenants(tenants.filter(tenant => tenant.id !== id));
      setFeedback('Tenant deleted successfully!');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setFeedback(`Failed to delete tenant: ${error.message}`);
    }
  };

  const handleEditClick = tenant => {
    setIsEditing(true);
    setAddTenant(true);
    setCurrentTenantId(tenant.id);
    setFirstName(tenant.firstname);
    setLastName(tenant.lastName);
    setEmail(tenant.email);
    setTenantAmount(tenant.tenantAmount);
    setPhoneNumber(tenant.phoneNumber);
    setTenancyStartDate(tenant.tenancyStartDate ? tenant.tenancyStartDate.toDate().toISOString().split('T')[0] : '');
    setUsername(tenant.displayName);
    setTenancyEndDate(
      tenant.tenancyEndDate ? tenant.tenancyEndDate.toDate().toISOString().split('T')[0] : ''
    );
    setTag(tenant.tag || 'Tenant');
    setFeedback('');
  };
  const handleAddBtn = ()=>{
    setFirstName('');
      setLastName('');
      setEmail('');
      setTenantAmount('');
      setPhoneNumber('');
      setTenancyEndDate('');
      setTenancyStartDate('');
      setTag('tenant');
      setIsEditing(false);
      setCurrentTenantId(null);
      setAddTenant(false);
    setAddTenant(!addTenant);
    setIsEditing(false);
  }

  const exportToCSV = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Tenant Amount',
      'Email',
      'Phone Number',
      'Day Booked',
      'Tenancy Start Date',
      'Tenancy End Date',
      'Tag',
      'Authoriser',
    ];

    const rows = tenants.map(tenant => [
      tenant.firstname || '',
      tenant.lastName || '',
      tenant.tenantAmount || '',
      tenant.email || '',
      tenant.phoneNumber || '',
      tenant.dayBooked?.toDate().toLocaleDateString('en-GB') || '',
      tenant.tenancyStartDate?.toDate().toLocaleDateString('en-GB') || '',

      tenant.tenancyEndDate?.toDate().toLocaleDateString('en-GB') || '',

      tenant.tag || '',
      tenant.username || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'tenant_bookings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return <div className="text-center mt-20">Loading authentication...</div>;
  }

  if (!userLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin && !isManager && !isStaff) {
    return (
      <div className="text-center mt-20">{console.log(currentUser)}
        <h2 className="text-3xl font-bold">Access Denied</h2>
        <p className="text-lg mt-4">
          You do not have the necessary permissions to view this page. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <main>
      
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>TENANTS</h1>
          
        </div>
        <div className={styles.buttonsCon}>
          {(isAdmin || isManager || isStaff) && (
            <>
              <div  className={styles.leftHeader}>
              
                <button className={styles.addBtn} onClick={handleAddBtn}>
                  <FontAwesomeIcon icon={faUser} style={{color: "white", paddingRight: '4px'}} />{addTenant ? 'Close' : '+ Add Tenant'}
                </button>
                {(isAdmin || isManager) && (<button id={styles.exportData} onClick={exportToCSV}><FontAwesomeIcon icon={faFileArrowDown} style={{color: "#7991a3", paddingRight: '4px'}} />
                  Export to Excel
                </button> )}
                     

              </div>
              <div className={styles.rightHeader}> {isAdmin &&(<div><Link to={'/admin'} ><button id={styles.adminPage}><FontAwesomeIcon icon={faShuffle}style={{ color: "#7991a3", paddingRight: '4px' }}/>Change roles</button></Link> </div>)}</div>
          
            </>
            
          )}
        </div>     
      </header>

      {feedback && (
        <p className={feedback.toLowerCase().includes('fail') ? styles.errorMsg : styles.successMsg}>
          {feedback}
        </p>
      )}

      {(isAdmin || isManager || isStaff) && (
        <div className={styles.tableContainer}>
          <h2 style={{padding: '20px'}}>Current Tenants</h2>
          {tenants.length === 0 ? (
            <p>No tenant records found.</p>
          ) : (
            <table id={styles.tenantTable}>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Day Booked</th>
                  <th>Tenancy Start Date</th>
                  <th>Tenancy End Date</th>
                  <th>Tenant Amount</th>
                  <th>Tag</th>
                  <th>Authoriser</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant.id}>
                    <td>{tenant.firstname}</td>
                    <td>{tenant.lastName}</td>
                    <td>{tenant.email}</td>
                    <td>{tenant.phoneNumber}</td>
                    <td>{formatUKDate(tenant.dayBooked)}</td>
                    <td>{tenant.tenancyStartDate ? formatUKDate(tenant.tenancyStartDate) : '-'}</td>
                    <td>{tenant.tenancyEndDate ? formatUKDate(tenant.tenancyEndDate) : '-'}</td>
                    <td>{tenant.tenantAmount}</td>
                    <td>{tenant.tag}</td>
                    <td>{tenant.username}</td>
                    <td>{(isAdmin || isManager ||isStaff) &&(<button id={styles.editBtn} onClick={() => handleEditClick(tenant)}>Edit</button>)}
                        {(isAdmin || isManager) &&(<button id={styles.deleteBtn}onClick={()=>{
                          if (window.confirm(`Are you sure you want to delete ${tenant.firstname} ${tenant.lastName}'s record?`)) {
                              handleDelete(tenant.id);
                          }
                        }}>Delete</button>)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{padding: '20px'}}>
            You:
            {isAdmin ? ' Admin' : ''}
            {isManager ? ' Manager' : ''}
            {isStaff ? ' Staff' : ''}
            {isTenant ? ' Tenant' : ''}
           <br></br> {currentUser.email}
          </p>
          
        </div>
      )}
      {(isAdmin || isManager || isStaff) && (
        <div id={styles.newTenant} style={{ display: addTenant ? 'block' : 'none' }}>
          <form onSubmit={ handleSubmit} id={styles.newTenantForm}>
            <h2>New Tenant</h2>

            <label htmlFor="fname">First Name</label>
            <input
              type="text"
              value={firstname}
              onChange={e => setFirstName(capitaliseWords(e.target.value))}
            />

            <label htmlFor="lname">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(capitaliseWords(e.target.value))}
            />

            <label htmlFor="email">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />

            <label htmlFor="tenantAmount">Tenant Amount</label>
            <input type="text" value={tenantAmount} onChange={e => setTenantAmount(e.target.value)} />

            <label htmlFor="phoneNum">Telephone Number with country code</label>
            <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />

            <label htmlFor="tenancyStartDate">Tenancy Start Date</label>
            <input
              type="date"
              value={tenancyStartDate}
              onChange={e => setTenancyStartDate(e.target.value)}
            />
            <label htmlFor="tenancyEndDate">Tenancy End Date</label>
            <input
              type="date"
              value={tenancyEndDate}
              onChange={e => setTenancyEndDate(e.target.value)}
            />

            

            <input type="submit" value="Submit" id={styles.save} />
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
          </form>
        </div>
      )}
      

    </main>
  );
};

export default Home;
