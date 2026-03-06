package com.oryfolks.lms_backend.service;

import java.util.List;

import com.oryfolks.lms_backend.DTO.TeamMemberDTO;

public interface ManagerService {
    public List<TeamMemberDTO> getMyTeam();
}
