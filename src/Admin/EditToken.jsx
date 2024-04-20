import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@nextui-org/react";

export default function ManageCounterModal({ onClose }) {
    const [isOpen, setIsOpen] = useState(false);
    const [tokens, setTokens] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "tokens"));
                const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setTokens(data);
            } catch (error) {
                console.error("Error fetching data: ", error);
            }
        };

        fetchData();
        const unsubscribe = onSnapshot(collection(db, "tokens"), (snapshot) => {
            const updatedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setTokens(updatedData);
        });

        return () => unsubscribe();
    }, []);

    const handleOpenModal = () => {
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const handleResetToken = async () => {
        try {
            // Update the token value in the database
            const tokenRef = doc(db, "tokens", "lastToken");
            await setDoc(tokenRef, { lastToken: 1 });
            console.log("Token value set to 1 in the database");

            // Update the UI by setting the token value to 1
            setTokens([{ id: "lastToken", lastToken: 1 }]);
        } catch (error) {
            console.error("Error resetting token: ", error);
        }
    };


    return (
        <>
            <Button onPress={handleOpenModal} className="bg-[#6236F5] text-white">
                Reset
            </Button>
            <Modal isOpen={isOpen} onClose={handleCloseModal}>
                <ModalContent>
                    <ModalHeader>Reset tokens</ModalHeader>
                    <ModalBody>
                        <Table aria-label="Example static collection table">
                            <TableHeader>
                                <TableColumn>Sl.no</TableColumn>
                                <TableColumn>Token ID</TableColumn>
                                <TableColumn>Token Value</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {tokens.map((token, index) => (
                                    <TableRow key={token.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{token.id}</TableCell>
                                        <TableCell>{token.lastTokenNumber}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="bg-blue-500" onClick={handleResetToken}>Set Token to 1</Button>
                        <Button color="primary" onClick={handleCloseModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
