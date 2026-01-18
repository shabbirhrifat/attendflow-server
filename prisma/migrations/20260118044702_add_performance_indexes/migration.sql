-- CreateIndex
CREATE INDEX "attendance_sessions_courseId_idx" ON "attendance_sessions"("courseId");

-- CreateIndex
CREATE INDEX "attendance_sessions_teacherId_idx" ON "attendance_sessions"("teacherId");

-- CreateIndex
CREATE INDEX "attendance_sessions_date_idx" ON "attendance_sessions"("date");

-- CreateIndex
CREATE INDEX "attendance_sessions_isActive_idx" ON "attendance_sessions"("isActive");

-- CreateIndex
CREATE INDEX "attendances_userId_date_idx" ON "attendances"("userId", "date");

-- CreateIndex
CREATE INDEX "attendances_courseId_idx" ON "attendances"("courseId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_markedBy_idx" ON "attendances"("markedBy");

-- CreateIndex
CREATE INDEX "attendances_attendanceSessionId_idx" ON "attendances"("attendanceSessionId");

-- CreateIndex
CREATE INDEX "batches_year_idx" ON "batches"("year");

-- CreateIndex
CREATE INDEX "batches_isActive_idx" ON "batches"("isActive");

-- CreateIndex
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");

-- CreateIndex
CREATE INDEX "courses_teacherId_idx" ON "courses"("teacherId");

-- CreateIndex
CREATE INDEX "courses_batchId_idx" ON "courses"("batchId");

-- CreateIndex
CREATE INDEX "courses_semesterId_idx" ON "courses"("semesterId");

-- CreateIndex
CREATE INDEX "courses_isActive_idx" ON "courses"("isActive");

-- CreateIndex
CREATE INDEX "courses_code_idx" ON "courses"("code");

-- CreateIndex
CREATE INDEX "departments_isActive_idx" ON "departments"("isActive");

-- CreateIndex
CREATE INDEX "students_batchId_idx" ON "students"("batchId");

-- CreateIndex
CREATE INDEX "students_departmentId_idx" ON "students"("departmentId");

-- CreateIndex
CREATE INDEX "students_isActive_idx" ON "students"("isActive");

-- CreateIndex
CREATE INDEX "students_studentId_idx" ON "students"("studentId");

-- CreateIndex
CREATE INDEX "teachers_departmentId_idx" ON "teachers"("departmentId");

-- CreateIndex
CREATE INDEX "teachers_isActive_idx" ON "teachers"("isActive");

-- CreateIndex
CREATE INDEX "teachers_employeeId_idx" ON "teachers"("employeeId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
