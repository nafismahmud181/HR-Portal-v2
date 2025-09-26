/**
 * Employee ID Synchronization Utility
 * 
 * This utility helps identify and fix mismatches between invite employeeId
 * and actual employee record employeeId in Firestore.
 */

import { db } from "./firebase";
import { collection, doc, getDocs, updateDoc, query, where } from "firebase/firestore";

export interface EmployeeIdMismatch {
  uid: string;
  inviteEmployeeId: string;
  employeeRecordId: string;
  email: string;
  name: string;
}

/**
 * Find employees where the employeeId in the employee record
 * doesn't match the employeeId from the invite
 */
export async function findEmployeeIdMismatches(orgId: string): Promise<EmployeeIdMismatch[]> {
  const mismatches: EmployeeIdMismatch[] = [];
  
  try {
    // Get all invites
    const invitesRef = collection(db, "organizations", orgId, "invites");
    const invitesSnapshot = await getDocs(invitesRef);
    
    // Get all employees
    const employeesRef = collection(db, "organizations", orgId, "employees");
    const employeesSnapshot = await getDocs(employeesRef);
    
    // Create a map of employee records by email for easy lookup
    const employeeMap = new Map();
    employeesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      employeeMap.set(data.email, { uid: doc.id, employeeId: data.employeeId, ...data });
    });
    
    // Check each invite against corresponding employee record
    invitesSnapshot.docs.forEach(doc => {
      const inviteData = doc.data();
      const email = doc.id; // invite document ID is the email
      
      if (employeeMap.has(email)) {
        const employeeRecord = employeeMap.get(email);
        
        // Check if employeeId from invite matches employee record
        if (inviteData.employeeId && inviteData.employeeId !== employeeRecord.employeeId) {
          mismatches.push({
            uid: employeeRecord.uid,
            inviteEmployeeId: inviteData.employeeId,
            employeeRecordId: employeeRecord.employeeId,
            email: email,
            name: employeeRecord.name || inviteData.name || email
          });
        }
      }
    });
    
    console.log(`Found ${mismatches.length} employee ID mismatches in organization ${orgId}`);
    return mismatches;
    
  } catch (error) {
    console.error("Error finding employee ID mismatches:", error);
    throw error;
  }
}

/**
 * Fix employee ID mismatches by updating employee records
 * to use the employeeId from the invite
 */
export async function fixEmployeeIdMismatches(orgId: string, mismatches: EmployeeIdMismatch[]): Promise<void> {
  try {
    for (const mismatch of mismatches) {
      console.log(`Fixing employee ID for ${mismatch.name} (${mismatch.email})`);
      console.log(`  From: ${mismatch.employeeRecordId}`);
      console.log(`  To: ${mismatch.inviteEmployeeId}`);
      
      const employeeRef = doc(db, "organizations", orgId, "employees", mismatch.uid);
      await updateDoc(employeeRef, {
        employeeId: mismatch.inviteEmployeeId,
        lastUpdated: new Date().toISOString(),
        updatedBy: "system-sync"
      });
      
      console.log(`  ✅ Fixed`);
    }
    
    console.log(`Successfully fixed ${mismatches.length} employee ID mismatches`);
  } catch (error) {
    console.error("Error fixing employee ID mismatches:", error);
    throw error;
  }
}

/**
 * Sync all employee IDs in an organization
 * This function finds mismatches and fixes them automatically
 */
export async function syncEmployeeIds(orgId: string): Promise<{ fixed: number; errors: string[] }> {
  const errors: string[] = [];
  let fixed = 0;
  
  try {
    const mismatches = await findEmployeeIdMismatches(orgId);
    
    if (mismatches.length === 0) {
      console.log("No employee ID mismatches found");
      return { fixed: 0, errors: [] };
    }
    
    await fixEmployeeIdMismatches(orgId, mismatches);
    fixed = mismatches.length;
    
  } catch (error) {
    const errorMessage = `Failed to sync employee IDs: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage);
    errors.push(errorMessage);
  }
  
  return { fixed, errors };
}

/**
 * Get a summary of employee ID status in an organization
 */
export async function getEmployeeIdStatus(orgId: string): Promise<{
  totalEmployees: number;
  totalInvites: number;
  mismatches: number;
  status: 'healthy' | 'has_mismatches' | 'error';
}> {
  try {
    const mismatches = await findEmployeeIdMismatches(orgId);
    
    const employeesRef = collection(db, "organizations", orgId, "employees");
    const employeesSnapshot = await getDocs(employeesRef);
    
    const invitesRef = collection(db, "organizations", orgId, "invites");
    const invitesSnapshot = await getDocs(invitesRef);
    
    return {
      totalEmployees: employeesSnapshot.docs.length,
      totalInvites: invitesSnapshot.docs.length,
      mismatches: mismatches.length,
      status: mismatches.length === 0 ? 'healthy' : 'has_mismatches'
    };
  } catch (error) {
    console.error("Error getting employee ID status:", error);
    return {
      totalEmployees: 0,
      totalInvites: 0,
      mismatches: 0,
      status: 'error'
    };
  }
}
