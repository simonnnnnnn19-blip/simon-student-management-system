// ======================================================
// STUDENT MANAGEMENT SYSTEM - FRONTEND JAVASCRIPT
// ======================================================

const API_URL = "/api";

// ------------------------------------------------------
// Global Data
// ------------------------------------------------------

let students = JSON.parse(localStorage.getItem("students")) || [];
let attendanceRecords =
    JSON.parse(localStorage.getItem("attendanceRecords")) || [];
let marksRecords =
    JSON.parse(localStorage.getItem("marksRecords")) || [];
let departments =
    JSON.parse(localStorage.getItem("departments")) || [];

let editingStudentId = null;


// ------------------------------------------------------
// Helper Functions
// ------------------------------------------------------

function $(id) {
    return document.getElementById(id);
}


// Prevent HTML injection when displaying text
function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// API request helper
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}


// ------------------------------------------------------
// DASHBOARD STATISTICS
// ------------------------------------------------------

function updateDashboardStats() {

    if ($("totalStudents")) {
        $("totalStudents").textContent = students.length;
    }

    if ($("totalAttendance")) {
        $("totalAttendance").textContent = attendanceRecords.length;
    }

    if ($("totalMarks")) {
        $("totalMarks").textContent = marksRecords.length;
    }

    if ($("totalDepartments")) {
        $("totalDepartments").textContent = departments.length;
    }
}


// ------------------------------------------------------
// SECTION NAVIGATION
// ------------------------------------------------------

function showSection(sectionId) {

    const sections = [
        "studentsSection",
        "attendanceSection",
        "marksSection",
        "departmentSection"
    ];

    sections.forEach(id => {

        const section = $(id);

        if (section) {
            section.classList.add("hidden");
        }
    });

    const selectedSection = $(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");

        selectedSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ------------------------------------------------------
// HOME BUTTON
// ------------------------------------------------------

function showHome() {

    const sections = [
        "studentsSection",
        "attendanceSection",
        "marksSection",
        "departmentSection"
    ];

    sections.forEach(id => {

        const section = $(id);

        if (section) {
            section.classList.add("hidden");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ------------------------------------------------------
// STUDENT SECTION
// ------------------------------------------------------

function showStudentForm() {

    showSection("studentsSection");

    const form = $("studentForm");

    if (form) {
        form.classList.remove("hidden");
    }
}


function resetStudentForm() {

    if ($("studentForm")) {
        $("studentForm").reset();
    }

    editingStudentId = null;

    if ($("studentSubmitBtn")) {
        $("studentSubmitBtn").textContent = "Add Student";
    }

    if ($("cancelStudentEditBtn")) {
        $("cancelStudentEditBtn").classList.add("hidden");
    }
}


// ------------------------------------------------------
// LOAD STUDENTS
// ------------------------------------------------------

async function loadStudents() {

    try {

        const data = await apiRequest(`${API_URL}/students`);

        students = Array.isArray(data) ? data : [];

        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );

        renderStudents();
        updateStudentDropdowns();
        updateDashboardStats();

    } catch (error) {

        console.error("Student loading error:", error);

        // Use saved local data if server is unavailable
        renderStudents();
        updateStudentDropdowns();
        updateDashboardStats();
    }
}


// ------------------------------------------------------
// ADD / UPDATE STUDENT
// ------------------------------------------------------

async function saveStudent(event) {

    event.preventDefault();

    const studentId = $("studentId").value.trim();
    const studentName = $("studentName").value.trim();
    const email = $("studentEmail").value.trim();
    const phone = $("studentPhone").value.trim();
    const department = $("studentDepartment").value.trim();

    if (!studentId || !studentName) {
        alert("Please enter Student ID and Student Name.");
        return;
    }

    const studentData = {
        student_id: studentId,
        student_name: studentName,
        email: email,
        phone: phone,
        department: department
    };

    try {

        if (editingStudentId) {

            await apiRequest(
                `${API_URL}/students/${encodeURIComponent(editingStudentId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(studentData)
                }
            );

            alert("Student updated successfully!");

        } else {

            await apiRequest(
                `${API_URL}/students`,
                {
                    method: "POST",
                    body: JSON.stringify(studentData)
                }
            );

            alert("Student added successfully!");
        }

        resetStudentForm();
        await loadStudents();

    } catch (error) {

        alert(error.message);
    }
}


// ------------------------------------------------------
// EDIT STUDENT
// ------------------------------------------------------

function editStudent(studentId) {

    const student = students.find(
        s => String(s.student_id) === String(studentId)
    );

    if (!student) {
        alert("Student not found.");
        return;
    }

    showStudentForm();

    $("studentId").value = student.student_id || "";
    $("studentName").value = student.student_name || "";
    $("studentEmail").value = student.email || "";
    $("studentPhone").value = student.phone || "";
    $("studentDepartment").value = student.department || "";

    editingStudentId = student.student_id;

    if ($("studentSubmitBtn")) {
        $("studentSubmitBtn").textContent = "Update Student";
    }

    if ($("cancelStudentEditBtn")) {
        $("cancelStudentEditBtn").classList.remove("hidden");
    }

    window.scrollTo({
        top: $("studentsSection").offsetTop - 20,
        behavior: "smooth"
    });
}


// ------------------------------------------------------
// DELETE STUDENT
// ------------------------------------------------------

async function deleteStudent(studentId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        await apiRequest(
            `${API_URL}/students/${encodeURIComponent(studentId)}`,
            {
                method: "DELETE"
            }
        );

        alert("Student deleted successfully!");

        await loadStudents();
        await loadAttendance();
        await loadMarks();

    } catch (error) {

        alert(error.message);
    }
}


// ------------------------------------------------------
// SEARCH STUDENT
// ------------------------------------------------------

function searchStudent() {

    const searchValue =
        $("searchInput").value.trim().toLowerCase();

    const filteredStudents = students.filter(student => {

        const name =
            String(student.student_name || "").toLowerCase();

        const id =
            String(student.student_id || "").toLowerCase();

        return (
            name.includes(searchValue) ||
            id.includes(searchValue)
        );
    });

    renderStudents(filteredStudents);
}


// ------------------------------------------------------
// DISPLAY STUDENTS
// ------------------------------------------------------

function renderStudents(list = students) {

    const studentList = $("studentList");

    if (!studentList) {
        return;
    }

    if (list.length === 0) {

        studentList.innerHTML =
            "<p>No students found.</p>";

        return;
    }

    studentList.innerHTML = list.map(student => {

        return `
            <div class="record-card">

                <h3>👨‍🎓 ${escapeHTML(student.student_name)}</h3>

                <p>
                    <strong>Student ID:</strong>
                    ${escapeHTML(student.student_id)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(student.email)}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(student.phone)}
                </p>

                <p>
                    <strong>Department:</strong>
                    ${escapeHTML(student.department)}
                </p>

                <div class="record-actions">

                    <button
                        type="button"
                        onclick="editStudent('${escapeHTML(student.student_id)}')">
                        ✏️ Edit
                    </button>

                    <button
                        type="button"
                        class="danger"
                        onclick="deleteStudent('${escapeHTML(student.student_id)}')">
                        🗑️ Delete
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


// ------------------------------------------------------
// STUDENT DROPDOWNS
// ------------------------------------------------------

function updateStudentDropdowns() {

    const dropdowns = [
        $("attendanceStudent"),
        $("marksStudentId")
    ];

    dropdowns.forEach(dropdown => {

        if (!dropdown) {
            return;
        }

        const currentValue = dropdown.value;

        dropdown.innerHTML = `
            <option value="">Select Student</option>
        `;

        students.forEach(student => {

            const option =
                document.createElement("option");

            option.value = student.student_id;

            option.textContent =
                `${student.student_id} - ${student.student_name}`;

            dropdown.appendChild(option);
        });

        dropdown.value = currentValue;
    });
}


// ------------------------------------------------------
// ATTENDANCE
// ------------------------------------------------------

function showAttendance() {

    showSection("attendanceSection");

    loadAttendance();
}


async function loadAttendance() {

    try {

        const data =
            await apiRequest(`${API_URL}/attendance`);

        attendanceRecords =
            Array.isArray(data) ? data : [];

        localStorage.setItem(
            "attendanceRecords",
            JSON.stringify(attendanceRecords)
        );

        renderAttendance();
        updateDashboardStats();

    } catch (error) {

        console.error(
            "Attendance loading error:",
            error
        );

        renderAttendance();
        updateDashboardStats();
    }
}


// ------------------------------------------------------
// ADD ATTENDANCE
// ------------------------------------------------------

async function saveAttendance(event) {

    event.preventDefault();

    const studentId =
        $("attendanceStudent").value;

    const status =
        $("attendanceStatus").value;

    if (!studentId || !status) {

        alert("Please select student and attendance status.");

        return;
    }

    try {

        await apiRequest(
            `${API_URL}/attendance`,
            {
                method: "POST",

                body: JSON.stringify({
                    student_id: studentId,
                    status: status
                })
            }
        );

        alert("Attendance added successfully!");

        $("attendanceForm").reset();

        await loadAttendance();

    } catch (error) {

        alert(error.message);
    }
}


// ------------------------------------------------------
// DISPLAY ATTENDANCE
// ------------------------------------------------------

function renderAttendance() {

    const attendanceList =
        $("attendanceList");

    if (!attendanceList) {
        return;
    }

    if (attendanceRecords.length === 0) {

        attendanceList.innerHTML =
            "<p>No attendance records found.</p>";

        return;
    }

    attendanceList.innerHTML =
        attendanceRecords.map(record => {

            const student =
                students.find(
                    s =>
                        String(s.student_id) ===
                        String(record.student_id)
                );

            const studentName =
                student
                    ? student.student_name
                    : "Unknown Student";

            return `
                <div class="record-card">

                    <h3>🗓️ Attendance Record</h3>

                    <p>
                        <strong>Student:</strong>
                        ${escapeHTML(studentName)}
                    </p>

                    <p>
                        <strong>Student ID:</strong>
                        ${escapeHTML(record.student_id)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(record.attendance_date)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${escapeHTML(record.status)}
                    </p>

                </div>
            `;

        }).join("");
}


// ------------------------------------------------------
// MARKS
// ------------------------------------------------------

function showMarks() {

    showSection("marksSection");

    loadMarks();
}


async function loadMarks() {

    try {

        const data =
            await apiRequest(`${API_URL}/marks`);

        marksRecords =
            Array.isArray(data) ? data : [];

        localStorage.setItem(
            "marksRecords",
            JSON.stringify(marksRecords)
        );

        renderMarks();
        updateDashboardStats();

    } catch (error) {

        console.error(
            "Marks loading error:",
            error
        );

        renderMarks();
        updateDashboardStats();
    }
}


// ------------------------------------------------------
// ADD MARKS
// ------------------------------------------------------

async function saveMarks(event) {

    event.preventDefault();

    const studentId =
        $("marksStudentId").value;

    const subject =
        $("subject").value.trim();

    const marksValue =
        $("marks").value;

    if (!studentId || !subject || marksValue === "") {

        alert("Please fill all marks details.");

        return;
    }

    const marksNumber =
        Number(marksValue);

    if (
        Number.isNaN(marksNumber) ||
        marksNumber < 0 ||
        marksNumber > 100
    ) {

        alert("Marks must be between 0 and 100.");

        return;
    }

    try {

        await apiRequest(
            `${API_URL}/marks`,
            {
                method: "POST",

                body: JSON.stringify({
                    student_id: studentId,
                    subject: subject,
                    marks: marksNumber
                })
            }
        );

        alert("Marks added successfully!");

        $("marksForm").reset();

        await loadMarks();

    } catch (error) {

        alert(error.message);
    }
}


// ------------------------------------------------------
// DISPLAY MARKS
// ------------------------------------------------------

function renderMarks() {

    const marksList =
        $("marksList");

    if (!marksList) {
        return;
    }

    if (marksRecords.length === 0) {

        marksList.innerHTML =
            "<p>No marks records found.</p>";

        return;
    }

    marksList.innerHTML =
        marksRecords.map(record => {

            const student =
                students.find(
                    s =>
                        String(s.student_id) ===
                        String(record.student_id)
                );

            const studentName =
                student
                    ? student.student_name
                    : "Unknown Student";

            return `
                <div class="record-card">

                    <h3>📚 Marks Record</h3>

                    <p>
                        <strong>Student:</strong>
                        ${escapeHTML(studentName)}
                    </p>

                    <p>
                        <strong>Student ID:</strong>
                        ${escapeHTML(record.student_id)}
                    </p>

                    <p>
                        <strong>Subject:</strong>
                        ${escapeHTML(record.subject)}
                    </p>

                    <p>
                        <strong>Marks:</strong>
                        ${escapeHTML(record.marks)}
                    </p>

                    <div class="record-actions">

                        <button
                            type="button"
                            class="danger"
                            onclick="deleteMarks(${record.marks_id})">
                            🗑️ Delete
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// ------------------------------------------------------
// DELETE MARKS
// ------------------------------------------------------

async function deleteMarks(marksId) {

    const confirmDelete =
        confirm("Are you sure you want to delete this marks record?");

    if (!confirmDelete) {
        return;
    }

    try {

        await apiRequest(
            `${API_URL}/marks/${marksId}`,
            {
                method: "DELETE"
            }
        );

        alert("Marks deleted successfully!");

        await loadMarks();

    } catch (error) {

        alert(error.message);
    }
}


// ------------------------------------------------------
// DEPARTMENT
// ------------------------------------------------------

function showDepartments() {

    showSection("departmentSection");

    renderDepartments();
}


// ------------------------------------------------------
// ADD DEPARTMENT
// ------------------------------------------------------

function saveDepartment(event) {

    event.preventDefault();

    const departmentName =
        $("departmentName").value.trim();

    if (!departmentName) {

        alert("Please enter department name.");

        return;
    }

    const alreadyExists =
        departments.some(
            department =>
                department.toLowerCase() ===
                departmentName.toLowerCase()
        );

    if (alreadyExists) {

        alert("This department already exists.");

        return;
    }

    departments.push(departmentName);

    localStorage.setItem(
        "departments",
        JSON.stringify(departments)
    );

    $("departmentForm").reset();

    renderDepartments();

    updateDashboardStats();

    alert("Department added successfully!");
}


// ------------------------------------------------------
// DISPLAY DEPARTMENTS
// ------------------------------------------------------

function renderDepartments() {

    const departmentList =
        $("departmentList");

    if (!departmentList) {
        return;
    }

    if (departments.length === 0) {

        departmentList.innerHTML =
            "<p>No departments found.</p>";

        return;
    }

    departmentList.innerHTML =
        departments.map((department, index) => {

            return `
                <div class="record-card">

                    <h3>🏫 ${escapeHTML(department)}</h3>

                    <div class="record-actions">

                        <button
                            type="button"
                            class="danger"
                            onclick="deleteDepartment(${index})">
                            🗑️ Delete
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// ------------------------------------------------------
// DELETE DEPARTMENT
// ------------------------------------------------------

function deleteDepartment(index) {

    const confirmDelete =
        confirm("Are you sure you want to delete this department?");

    if (!confirmDelete) {
        return;
    }

    departments.splice(index, 1);

    localStorage.setItem(
        "departments",
        JSON.stringify(departments)
    );

    renderDepartments();

    updateDashboardStats();

    alert("Department deleted successfully!");
}


// ------------------------------------------------------
// NAVIGATION BUTTONS
// ------------------------------------------------------

function setupNavigation() {

    if ($("homeBtn")) {

        $("homeBtn").addEventListener(
            "click",
            showHome
        );
    }


    if ($("showStudentsBtn")) {

        $("showStudentsBtn").addEventListener(
            "click",
            showStudentForm
        );
    }


    if ($("showAttendanceBtn")) {

        $("showAttendanceBtn").addEventListener(
            "click",
            showAttendance
        );
    }


    if ($("showMarksBtn")) {

        $("showMarksBtn").addEventListener(
            "click",
            showMarks
        );
    }


    if ($("showDepartmentsBtn")) {

        $("showDepartmentsBtn").addEventListener(
            "click",
            showDepartments
        );
    }
}


// ------------------------------------------------------
// FORM EVENT LISTENERS
// ------------------------------------------------------

function setupForms() {

    if ($("studentForm")) {

        $("studentForm").addEventListener(
            "submit",
            saveStudent
        );
    }


    if ($("attendanceForm")) {

        $("attendanceForm").addEventListener(
            "submit",
            saveAttendance
        );
    }


    if ($("marksForm")) {

        $("marksForm").addEventListener(
            "submit",
            saveMarks
        );
    }


    if ($("departmentForm")) {

        $("departmentForm").addEventListener(
            "submit",
            saveDepartment
        );
    }


    if ($("cancelStudentEditBtn")) {

        $("cancelStudentEditBtn").addEventListener(
            "click",
            resetStudentForm
        );
    }


    if ($("searchInput")) {

        $("searchInput").addEventListener(
            "input",
            searchStudent
        );
    }
}


// ------------------------------------------------------
// INITIALIZE APPLICATION
// ------------------------------------------------------

async function initializeApp() {

    console.log("Starting Student Management System...");

    // Load local departments
    departments =
        JSON.parse(localStorage.getItem("departments")) || [];

    renderDepartments();

    // Load database records
    await loadStudents();

    await loadAttendance();

    await loadMarks();

    // Update dropdowns
    updateStudentDropdowns();

    // Update dashboard
    updateDashboardStats();

    // Navigation
    setupNavigation();

    // Forms
    setupForms();

    console.log(
        "Student Management System loaded successfully!"
    );
}


// ------------------------------------------------------
// START APPLICATION
// ------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);