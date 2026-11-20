const express = require("express");
const mysql = require("mysql2");

const app = express();

const PORT = 3000;


app.use(express.json());

app.use(express.static(__dirname));


/* =========================
   MYSQL CONNECTION
========================= */

const connection = mysql.createConnection({

    host: "localhost",

    user: "root",

    password: "Simon@19",
    database: "student_management"

});


connection.connect((err) => {

    if (err) {

        console.error(
            "MySQL connection failed:",
            err.message
        );

        return;
    }


    console.log(
        "Connected to MySQL database successfully!"
    );

});


/* =========================
   STUDENTS - GET
========================= */

app.get(
    "/api/students",
    (req, res) => {

        connection.query(
            "SELECT * FROM students ORDER BY student_name",

            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        message:
                            "Could not fetch students."
                    });
                }


                res.json(results);

            }
        );

    }
);


/* =========================
   STUDENTS - ADD
========================= */

app.post(
    "/api/students",
    (req, res) => {

        const {
            student_id,
            student_name,
            email,
            phone,
            department
        } = req.body;


        if (
            !student_id ||
            !student_name
        ) {

            return res.status(400).json({

                message:
                    "Student ID and name are required."

            });

        }


        const sql = `

            INSERT INTO students
            (
                student_id,
                student_name,
                email,
                phone,
                department
            )

            VALUES (?, ?, ?, ?, ?)

        `;


        connection.query(

            sql,

            [
                student_id,
                student_name,
                email || null,
                phone || null,
                department || null
            ],

            (err) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not add student. Check the ID and database."

                    });

                }


                res.status(201).json({

                    message:
                        "Student added successfully!"

                });

            }

        );

    }
);


/* =========================
   STUDENTS - UPDATE
========================= */

app.put(
    "/api/students/:id",
    (req, res) => {

        const {
            student_name,
            email,
            phone,
            department
        } = req.body;


        const sql = `

            UPDATE students

            SET
                student_name = ?,
                email = ?,
                phone = ?,
                department = ?

            WHERE student_id = ?

        `;


        connection.query(

            sql,

            [
                student_name,
                email || null,
                phone || null,
                department || null,
                req.params.id
            ],

            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not update student."

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        message:
                            "Student not found."

                    });

                }


                res.json({

                    message:
                        "Student updated successfully!"

                });

            }

        );

    }
);


/* =========================
   STUDENTS - DELETE
========================= */

app.delete(
    "/api/students/:id",
    (req, res) => {

        connection.query(

            "DELETE FROM students WHERE student_id = ?",

            [req.params.id],

            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not delete student."

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        message:
                            "Student not found."

                    });

                }


                res.json({

                    message:
                        "Student deleted successfully!"

                });

            }

        );

    }
);


/* =========================
   ATTENDANCE - GET
========================= */

app.get(
    "/api/attendance",
    (req, res) => {

        const sql = `

            SELECT

                attendance.attendance_id,

                attendance.student_id,

                students.student_name,

                attendance.attendance_date,

                attendance.status

            FROM attendance

            LEFT JOIN students

                ON attendance.student_id =
                   students.student_id

            ORDER BY attendance.attendance_id DESC

        `;


        connection.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not fetch attendance."

                    });

                }


                res.json(results);

            }
        );

    }
);


/* =========================
   ATTENDANCE - ADD
========================= */

app.post(
    "/api/attendance",
    (req, res) => {

        const {
            student_id,
            status
        } = req.body;


        if (
            !student_id ||
            !["Present", "Absent"]
                .includes(status)
        ) {

            return res.status(400).json({

                message:
                    "Select a student and choose Present or Absent."

            });

        }


        const sql = `

            INSERT INTO attendance
            (student_id, status)

            VALUES (?, ?)

        `;


        connection.query(

            sql,

            [
                student_id,
                status
            ],

            (err) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not save attendance."

                    });

                }


                res.status(201).json({

                    message:
                        "Attendance saved successfully!"

                });

            }

        );

    }
);


/* =========================
   MARKS - GET
========================= */

app.get(
    "/api/marks",
    (req, res) => {

        const sql = `

            SELECT

                marks.marks_id,

                marks.student_id,

                students.student_name,

                marks.subject,

                marks.marks

            FROM marks

            LEFT JOIN students

                ON marks.student_id =
                   students.student_id

            ORDER BY marks.marks_id DESC

        `;


        connection.query(
            sql,
            (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not fetch marks."

                    });

                }


                res.json(results);

            }
        );

    }
);


/* =========================
   MARKS - ADD
========================= */

app.post(
    "/api/marks",
    (req, res) => {

        const {
            student_id,
            subject,
            marks
        } = req.body;


        const markValue =
            Number(marks);


        if (
            !student_id ||
            !subject ||
            marks === undefined ||
            marks === null
        ) {

            return res.status(400).json({

                message:
                    "Student ID, subject, and marks are required."

            });

        }


        if (
            !Number.isFinite(markValue) ||
            markValue < 0 ||
            markValue > 100
        ) {

            return res.status(400).json({

                message:
                    "Marks must be between 0 and 100."

            });

        }


        const sql = `

            INSERT INTO marks
            (student_id, subject, marks)

            VALUES (?, ?, ?)

        `;


        connection.query(

            sql,

            [
                student_id,
                subject,
                markValue
            ],

            (err) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not save marks."

                    });

                }


                res.status(201).json({

                    message:
                        "Marks saved successfully!"

                });

            }

        );

    }
);


/* =========================
   MARKS - UPDATE
========================= */

app.put(
    "/api/marks/:id",
    (req, res) => {

        const {
            subject,
            marks
        } = req.body;


        const markValue =
            Number(marks);


        if (
            !subject ||
            marks === undefined ||
            marks === null ||
            !Number.isFinite(markValue) ||
            markValue < 0 ||
            markValue > 100
        ) {

            return res.status(400).json({

                message:
                    "Enter a subject and marks between 0 and 100."

            });

        }


        const sql = `

            UPDATE marks

            SET
                subject = ?,
                marks = ?

            WHERE marks_id = ?

        `;


        connection.query(

            sql,

            [
                subject,
                markValue,
                req.params.id
            ],

            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not update marks."

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        message:
                            "Marks record not found."

                    });

                }


                res.json({

                    message:
                        "Marks updated successfully!"

                });

            }

        );

    }
);


/* =========================
   MARKS - DELETE
========================= */

app.delete(
    "/api/marks/:id",
    (req, res) => {

        connection.query(

            "DELETE FROM marks WHERE marks_id = ?",

            [req.params.id],

            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        message:
                            "Could not delete marks."

                    });

                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        message:
                            "Marks record not found."

                    });

                }


                res.json({

                    message:
                        "Marks deleted successfully!"

                });

            }

        );

    }
);


/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);