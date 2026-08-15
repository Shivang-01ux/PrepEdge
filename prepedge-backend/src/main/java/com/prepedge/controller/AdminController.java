package com.prepedge.controller;

import com.prepedge.dto.request.CreateFacultyRequest;
import com.prepedge.dto.response.AuthResponse;
import com.prepedge.entity.Role;
import com.prepedge.entity.User;
import com.prepedge.repository.UserRepository;
import com.prepedge.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /** Create a faculty account (Admin only) */
    @PostMapping("/faculty")
    public ResponseEntity<?> createFaculty(@Valid @RequestBody CreateFacultyRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email already registered"));
        }

        User faculty = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .college(req.getCollege())
                .department(req.getDepartment())
                .role(Role.ROLE_FACULTY)
                .build();

        userRepository.save(faculty);

        return ResponseEntity.ok(new AuthResponse(
                null,
                faculty.getUsername(),
                faculty.getEmail(),
                faculty.getRole().name(),
                faculty.getCollege(),
                faculty.getDepartment()
        ));
    }

    /** List all faculty members */
    @GetMapping("/faculty")
    public ResponseEntity<List<Map<String, Object>>> listFaculty() {
        List<User> faculties = userRepository.findByRole(Role.ROLE_FACULTY);
        List<Map<String, Object>> result = faculties.stream().map(f -> Map.<String, Object>of(
                "id", f.getId(),
                "username", f.getUsername(),
                "email", f.getEmail(),
                "department", f.getDepartment() != null ? f.getDepartment() : "",
                "college", f.getCollege() != null ? f.getCollege() : "",
                "createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    /** Delete a faculty member */
    @DeleteMapping("/faculty/{id}")
    public ResponseEntity<?> deleteFaculty(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.ROLE_FACULTY) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "User is not a faculty member"));
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Faculty deleted successfully"));
    }

    /** List all students (optionally filter by department) */
    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> listStudents(
            @RequestParam(required = false) String department) {
        List<User> students = department != null
                ? userRepository.findByDepartmentAndRole(department, Role.ROLE_STUDENT)
                : userRepository.findByRole(Role.ROLE_STUDENT);

        List<Map<String, Object>> result = students.stream().map(s -> Map.<String, Object>of(
                "id", s.getId(),
                "username", s.getUsername(),
                "email", s.getEmail(),
                "department", s.getDepartment() != null ? s.getDepartment() : "",
                "college", s.getCollege() != null ? s.getCollege() : "",
                "createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    /** Platform stats */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalStudents = userRepository.findByRole(Role.ROLE_STUDENT).size();
        long totalFaculty = userRepository.findByRole(Role.ROLE_FACULTY).size();
        return ResponseEntity.ok(Map.of(
                "totalStudents", totalStudents,
                "totalFaculty", totalFaculty
        ));
    }
}
