import { Box, Button, Checkbox, CircularProgress, FormControl, FormLabel,  ListItemText,  MenuItem, Select, SelectChangeEvent,  TextField } from '@mui/material';
import React, { useEffect, useState } from 'react'
import theme from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/store';
import {  fetchPermissions, updateRole } from '../../store/features/role.slice';
import { NewRole, Role } from '../../types/model/role.model';


interface EditRoleProps {
show:boolean;
role:Role
closeEditRole: () => void
}
const EditRole:React.FC<EditRoleProps> = ({show,role,closeEditRole}) => {
   
    const [value, setValue] = useState<NewRole>({
       name: '',
       description: '',
       permissions: []
      });
   
      const {status,task,permissions} = useAppSelector(state=>state.role);
      const dispatch = useAppDispatch()
      useEffect(() => {
       if(role){
        setValue({
          name: role.name || '',
          description: role.description ||'',
          permissions:role.permissions? role.permissions.map(p=>p.id):[]
        })
       }
       }, [role])
      useEffect(() => {
       dispatch(fetchPermissions())
      }, [])
      const handlePermissionChange = (e: SelectChangeEvent<typeof value.permissions>) => {
       
        setValue({
            ...value,
            permissions:typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
          });
      };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(updateRole({id:role.id,updatedRole:value,closeEditRole}));
  };


  const loading = status === 'loading' && task==='update-role'
  // const permissionsLoading = status === 'loading' && task==='fetch-permissions'
  return (
    <Box  sx={{display:show?'block':'none',maxWidth:700,mx:'auto',my:4}}>

<Box component={"form"} onSubmit={handleSubmit}>
<FormControl fullWidth>
                <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
                   Name
                </FormLabel>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Enter Name"
                  value={value.name}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
                   Description
                </FormLabel>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Enter Description"
                  value={value.description}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </FormControl>
              <FormControl fullWidth>
              <FormLabel sx={{ color: "#555", my: 1,fontSize:'0.9rem' }}>Role</FormLabel>

              <Select
                size="small"
               multiple
               value={value.permissions}
               onChange={handlePermissionChange}
               renderValue={(selected) => selected.map(s=>permissions.find(p=>p.id===s)?.codeName).join(', ')}
                // MenuProps={MenuProps}
              >
                 {permissions.map((permission) => (
            <MenuItem key={permission.id} value={permission.id}>
              <Checkbox checked={value.permissions.includes(permission.id)} />
              <ListItemText primary={permission.codeName} />
            </MenuItem>
          ))}
              </Select>
            </FormControl>
              
                           <Button
            fullWidth
                   type="submit"
                  variant="contained"
                  sx={{ textTransform: "none", color: "white" ,mt:1,fontWeight:theme.typography.fontWeightBold}}
                  disabled={loading}
                >
                 {loading ?<CircularProgress size='small'  sx={{color:'white',height:'28px !important',width:'28px !important'}} /> : 'Update role'}
                </Button>
          </Box>
    </Box>
  )
}

export default EditRole