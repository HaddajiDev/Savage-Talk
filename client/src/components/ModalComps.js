import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';



export const CreateComp = ({currentUser, friendsList, setFriendsList, CreateGroupFront, handleClose, showCreate, handleCreateAction}) => {    
    return(
        <>
        <Modal show={showCreate} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h5>Select Members</h5>
            <div className='friendAdd'>
                {currentUser?.friends.map((el) => (
                    <div key={el.freindId}>
                        <div className='friendAddlist'>
                            <p>{el.username}</p>
                            {friendsList.includes(el.freindId) ?
                            <button onClick={() => setFriendsList((prevFriendsList) => prevFriendsList.filter((friendId) => friendId !== el.freindId))
                            }>remove</button> :
                            <button onClick={() => setFriendsList((prevFriendsList) => [...prevFriendsList, el.freindId])}>Add</button>}
                        </div>
                        
                    </div>
                ))}                
            </div>            
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {handleClose(); handleCreateAction();}}>
            Close
          </Button>
          <Button variant="primary" onClick={CreateGroupFront}>
            Create
          </Button>
        </Modal.Footer>
        </Modal>        
        </>
    )
}


// export const SetModal = ({showCreate, handleClose, setts}) => {
//     return(
//         <>
//         <Modal show={showCreate} onHide={handleClose}>
//         <Modal.Header closeButton>
//           <Modal.Title>Create Group</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
            
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => {handleClose(); handleCreateAction();}}>
//             Close
//           </Button>
//           <Button variant="primary" onClick={CreateGroupFront}>
//             Create
//           </Button>
//         </Modal.Footer>
//         </Modal>        
//         </>
//     )
// }